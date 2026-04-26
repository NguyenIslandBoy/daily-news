package models

import "time"

type Topic struct {
	ID        int
	Name      string
	Keywords  []string
	CreatedAt time.Time
}
