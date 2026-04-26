package models

import "time"

type Topic struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Keywords  []string  `json:"keywords"`
	CreatedAt time.Time `json:"created_at"`
}
