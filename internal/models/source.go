package models

import "time"

type Source struct {
	ID            int
	Name          string
	URL           string
	FeedURL       string
	Type          string // "rss", "api", "html"
	Category      string
	Active        bool
	LastScrapedAt *time.Time
}
