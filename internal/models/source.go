package models

import "time"

type Source struct {
	ID            int        `json:"id"`
	Name          string     `json:"name"`
	URL           string     `json:"url"`
	FeedURL       string     `json:"feed_url"`
	Type          string     `json:"type"`
	Category      string     `json:"category"`
	Active        bool       `json:"active"`
	LastScrapedAt *time.Time `json:"last_scraped_at"`
}
