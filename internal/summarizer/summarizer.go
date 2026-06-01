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
	groqURL  = "https://api.groq.com/openai/v1/chat/completions"
	model    = "llama-3.3-70b-versatile"
	maxWords = 3000
)

var (
	tagStripper = regexp.MustCompile(`<[^>]+>`)
	scriptStyle = regexp.MustCompile(`(?is)<(script|style)[^>]*>.*?</(script|style)>`)
)

func FetchAndSummarize(ctx context.Context, articleURL, existingSummary, apiKey string) (string, error) {
	// log.Printf("[summarizer] fetching %s", articleURL)
	text, err := fetchText(articleURL)
	if err != nil || len(strings.Fields(text)) < 100 {
		// log.Printf("[summarizer] fetch failed or too short (err=%v words=%d), using existing summary", err, len(strings.Fields(text)))
		if existingSummary != "" {
			// log.Printf("[summarizer] summarizing existing summary via Groq")
			return summarize(ctx, existingSummary, apiKey)
		}
		return "", fmt.Errorf("could not extract article text: %w", err)
	}
	// log.Printf("[summarizer] fetched %d words, sending to Groq", len(strings.Fields(text)))
	return summarize(ctx, text, apiKey)
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

	cleaned := scriptStyle.ReplaceAllString(string(body), " ")
	cleaned = tagStripper.ReplaceAllString(cleaned, " ")
	cleaned = strings.Join(strings.Fields(cleaned), " ")

	words := strings.Fields(cleaned)
	if len(words) > maxWords {
		words = words[:maxWords]
	}

	return strings.Join(words, " "), nil
}

func summarize(ctx context.Context, text, apiKey string) (string, error) {
	log.Printf("[summarizer] calling Groq with %d chars", len(text))
	payload := map[string]any{
		"model": model,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "You are a news summarizer. Summarize the following article in 4-5 concise sentences covering the key facts, main argument, and any important implications. Be factual and direct. No preamble.",
			},
			{
				"role":    "user",
				"content": text,
			},
		},
		"max_tokens":  512,
		"temperature": 0.3,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "POST", groqURL, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("groq request failed: %w", err)
	}
	defer resp.Body.Close()
	// log.Printf("[summarizer] Groq status: %d", resp.StatusCode)

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("groq HTTP %d: %s", resp.StatusCode, string(body))
	}

	if resp.StatusCode == 413 {
		return "", fmt.Errorf("article too large for free tier — try a shorter article")
	}
	if resp.StatusCode == 429 {
		return "", fmt.Errorf("rate limit hit — wait a moment and try again")
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("groq response parse failed: %w", err)
	}
	if result.Error.Message != "" {
		return "", fmt.Errorf("groq error: %s", result.Error.Message)
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("groq returned no choices")
	}

	return strings.TrimSpace(result.Choices[0].Message.Content), nil
}
