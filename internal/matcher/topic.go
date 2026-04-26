package matcher

import (
	"regexp"
	"strings"

	"github.com/NguyenIslandBoy/daily-news/internal/models"
)

type Matcher struct {
	topics   []models.Topic
	patterns map[int][]*regexp.Regexp // topic ID → compiled patterns
}

func New(topics []models.Topic) *Matcher {
	m := &Matcher{
		topics:   topics,
		patterns: make(map[int][]*regexp.Regexp),
	}
	for _, t := range topics {
		m.patterns[t.ID] = compilePatterns(t.Keywords)
	}
	return m
}

func compilePatterns(keywords []string) []*regexp.Regexp {
	patterns := make([]*regexp.Regexp, 0, len(keywords))
	for _, kw := range keywords {
		escaped := regexp.QuoteMeta(strings.TrimSpace(kw))
		// Use \b for multi-word keywords, but for single short keywords
		// also allow matching at camelCase boundaries (e.g. OpenAI)
		r, err := regexp.Compile(`(?i)\b` + escaped + `\b`)
		if err != nil {
			continue
		}
		patterns = append(patterns, r)

		// For short keywords (<=3 chars), also match as uppercase suffix
		// e.g. "AI" in "OpenAI", "ML" in "AutoML"
		if len(kw) <= 3 {
			upper := strings.ToUpper(kw)
			r2, err := regexp.Compile(upper + `\b`)
			if err != nil {
				continue
			}
			patterns = append(patterns, r2)
		}
	}
	return patterns
}

// Match returns the ID of the first topic that matches title or summary.
// Returns nil if no topic matches.
func (m *Matcher) Match(title, summary string) *int {
	text := title + " " + summary
	for _, t := range m.topics {
		for _, p := range m.patterns[t.ID] {
			if p.MatchString(text) {
				id := t.ID
				return &id
			}
		}
	}
	return nil
}
