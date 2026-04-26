package matcher

import (
	"testing"

	"github.com/NguyenIslandBoy/daily-news/internal/models"
)

func TestMatch_WordBoundary(t *testing.T) {
	topics := []models.Topic{
		{ID: 1, Name: "AI", Keywords: []string{"ai", "machine learning", "llm"}},
		{ID: 2, Name: "Security", Keywords: []string{"security", "vulnerability", "CVE"}},
	}
	m := New(topics)

	tests := []struct {
		title   string
		summary string
		wantID  *int
		wantNil bool
	}{
		// Should match AI
		{"OpenAI releases new model", "", intPtr(1), false},
		{"Advances in machine learning", "", intPtr(1), false},

		// Should NOT match AI — "aid" contains "ai" but not as a word boundary
		{"Ukraine aid package approved", "", nil, true},
		{"Chairman speaks to press", "", nil, true},

		// Should match Security
		{"New CVE discovered in Linux kernel", "", intPtr(2), false},

		// No match
		{"Local weather forecast", "", nil, true},
	}

	for _, tt := range tests {
		got := m.Match(tt.title, tt.summary)
		if tt.wantNil && got != nil {
			t.Errorf("Match(%q) = %d, want nil", tt.title, *got)
		}
		if !tt.wantNil && (got == nil || *got != *tt.wantID) {
			wantID := 0
			if tt.wantID != nil {
				wantID = *tt.wantID
			}
			t.Errorf("Match(%q) = %v, want %d", tt.title, got, wantID)
		}
	}
}

func intPtr(i int) *int { return &i }
