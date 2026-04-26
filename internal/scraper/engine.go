package scraper

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/NguyenIslandBoy/daily-news/internal/db"
	"github.com/NguyenIslandBoy/daily-news/internal/matcher"
	"github.com/NguyenIslandBoy/daily-news/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/robfig/cron/v3"
)

type Engine struct {
	pool       *pgxpool.Pool
	matcher    *matcher.Matcher
	dedup      *Dedup
	lastScrape time.Time
	mu         sync.RWMutex
}

func NewEngine(pool *pgxpool.Pool, topics []models.Topic, seen map[string]struct{}) *Engine {
	return &Engine{
		pool:    pool,
		matcher: matcher.New(topics),
		dedup:   NewDedup(seen),
	}
}

func (e *Engine) LastScrape() time.Time {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.lastScrape
}

func (e *Engine) Start(ctx context.Context) {
	c := cron.New()

	c.AddFunc("*/15 * * * *", func() {
		e.runScrape()
	})

	c.Start()
	log.Println("Scraper started — runs every 15 minutes")

	// Run once immediately on startup
	go e.runScrape()

	<-ctx.Done()
	log.Println("Scraper shutting down...")
	c.Stop()
}

func (e *Engine) runScrape() {
	sources, err := db.GetActiveSources(e.pool)
	if err != nil {
		log.Printf("Failed to load sources: %v", err)
		return
	}

	sem := make(chan struct{}, 5)
	var wg sync.WaitGroup

	for _, src := range sources {
		sem <- struct{}{}
		wg.Add(1)
		go func(s models.Source) {
			defer func() { <-sem; wg.Done() }()
			e.scrapeSource(s)
		}(src)
	}

	wg.Wait()

	e.mu.Lock()
	e.lastScrape = time.Now()
	e.mu.Unlock()

	log.Printf("Scrape complete — %d sources processed", len(sources))
}

func (e *Engine) scrapeSource(source models.Source) {
	articles, err := fetchRSS(source)
	if err != nil {
		log.Printf("[%s] Fetch error: %v", source.Name, err)
		return
	}

	inserted := 0
	for _, a := range articles {
		if e.dedup.Seen(a.URL) {
			continue
		}

		a.TopicID = e.matcher.Match(a.Title, a.Summary)

		id, err := db.InsertArticle(e.pool, a)
		if err != nil {
			log.Printf("[%s] Insert error: %v", source.Name, err)
			continue
		}
		if id > 0 {
			e.dedup.Mark(a.URL)
			inserted++
			a.ID = id

			relatedIDs, err := db.FindCandidateIDs(e.pool, a)
			if err != nil {
				log.Printf("[%s] Relations error: %v", source.Name, err)
			} else if len(relatedIDs) > 0 {
				db.InsertRelations(e.pool, id, relatedIDs)
				log.Printf("[%s] %d relations inserted for article %d", source.Name, len(relatedIDs), id)
			}
		}

		time.Sleep(200 * time.Millisecond)
	}

	if err := db.UpdateLastScraped(e.pool, source.ID); err != nil {
		log.Printf("[%s] Failed to update last_scraped_at: %v", source.Name, err)
	}

	log.Printf("[%s] %d new articles inserted", source.Name, inserted)
}
