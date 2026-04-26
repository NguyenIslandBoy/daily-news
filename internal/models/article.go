package models

import "time"

type Article struct {
	ID          int
	URL         string
	URLHash     string
	Title       string
	Summary     string
	Author      string
	PublishedAt *time.Time
	ScrapedAt   time.Time
	SourceID    *int
	TopicID     *int
	Category    string
	ImageURL    string
	SourceName  string // joined field, not a DB column
}
