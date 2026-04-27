package summarizer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"
)

const (
	ollamaURL   = "http://localhost:11434/api/generate"
	model       = "phi3.5:latest"
	maxWords    = 800
	httpTimeout = 5 * time.Minute
)

var tagStripper = regexp.MustCompile(`<[^>]+>`)

// FetchAndSummarize fetches the article URL, extracts text, and summarizes it.
// Falls back to existingSummary if fetch or summarization fails.
func FetchAndSummarize(ctx context.Context, articleURL, existingSummary string) (string, error) {
	log.Printf("Fetching URL: %s", articleURL)
	text, err := fetchText(articleURL)
	if err != nil || len(strings.Fields(text)) < 100 {
		// Not enough content — fall back to existing RSS summary
		log.Printf("Fetch failed or too short, falling back to existing summary. err=%v words=%d", err, len(strings.Fields(text)))
		if existingSummary != "" {
			return summarize(ctx, existingSummary)
		}
		return "", fmt.Errorf("could not extract article text: %w", err)
	}
	log.Printf("Fetched %d words, sending to Phi 3.5", len(strings.Fields(text)))
	return summarize(ctx, text)
}

func fetchText(url string) (string, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; DailyNews/1.0)")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 512*1024))
	if err != nil {
		return "", err
	}

	// 1. Strip script and style blocks first
	scriptStyle := regexp.MustCompile(`(?is)<(script|style)[^>]*>.*?</(script|style)>`)
	cleaned := scriptStyle.ReplaceAllString(string(body), " ")

	// 2. Strip remaining HTML tags
	cleaned = tagStripper.ReplaceAllString(cleaned, " ")

	// 3. Collapse whitespace
	cleaned = strings.Join(strings.Fields(cleaned), " ")

	// 4. NOW truncate to maxWords — this will be actual words now
	words := strings.Fields(cleaned)
	if len(words) > maxWords {
		words = words[:maxWords]
	}

	return strings.Join(words, " "), nil
}

func summarize(ctx context.Context, text string) (string, error) {
	log.Printf("Sending %d chars to Ollama...", len(text))

	// Use a fresh context completely independent of request
	ollamaCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	prompt := fmt.Sprintf(
		"Summarize this article in 3 sentences. Be concise and factual. Article:\n\n%s",
		text,
	)

	payload := map[string]any{
		"model":  model,
		"prompt": prompt,
		"stream": false,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	client := &http.Client{Timeout: 5 * time.Minute}
	req, err := http.NewRequestWithContext(ollamaCtx, "POST", ollamaURL, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	log.Printf("Calling Ollama API...")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Ollama call failed: %v", err)
		return "", fmt.Errorf("ollama request failed: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("Ollama responded, reading body...")
	var result struct {
		Response string `json:"response"`
		Error    string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("ollama response parse failed: %w", err)
	}
	if result.Error != "" {
		return "", fmt.Errorf("ollama error: %s", result.Error)
	}

	log.Printf("Summary generated: %d chars", len(result.Response))
	return strings.TrimSpace(result.Response), nil
}
