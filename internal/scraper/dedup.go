package scraper

import (
	"sync"

	"github.com/NguyenIslandBoy/daily-news/internal/db"
)

type Dedup struct {
	mu   sync.RWMutex
	seen map[string]struct{}
}

func NewDedup(seen map[string]struct{}) *Dedup {
	return &Dedup{seen: seen}
}

func (d *Dedup) Seen(url string) bool {
	hash := db.URLHash(url)
	d.mu.RLock()
	defer d.mu.RUnlock()
	_, ok := d.seen[hash]
	return ok
}

func (d *Dedup) Mark(url string) {
	hash := db.URLHash(url)
	d.mu.Lock()
	defer d.mu.Unlock()
	d.seen[hash] = struct{}{}
}
