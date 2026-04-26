package models

import "time"

type Article struct {
	ID          int        `json:"id"`
	URL         string     `json:"url"`
	URLHash     string     `json:"-"`
	Title       string     `json:"title"`
	Summary     string     `json:"summary"`
	Author      string     `json:"author"`
	PublishedAt *time.Time `json:"published_at"`
	ScrapedAt   time.Time  `json:"scraped_at"`
	SourceID    *int       `json:"source_id"`
	TopicID     *int       `json:"topic_id"`
	Category    string     `json:"category"`
	ImageURL    string     `json:"image_url"`
	SourceName  string     `json:"source_name"`
}
