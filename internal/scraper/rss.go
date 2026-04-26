package scraper

import (
	"fmt"
	"strings"
	"time"

	"github.com/NguyenIslandBoy/daily-news/internal/models"
	"github.com/mmcdole/gofeed"
)

func fetchRSS(source models.Source) ([]models.Article, error) {
	fp := gofeed.NewParser()
	fp.UserAgent = "DailyNews/1.0 (+https://github.com/NguyenIslandBoy/daily-news)"

	feed, err := fp.ParseURL(source.FeedURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse feed %s: %w", source.FeedURL, err)
	}

	articles := make([]models.Article, 0, len(feed.Items))
	for _, item := range feed.Items {
		if item.Link == "" || item.Title == "" {
			continue
		}

		a := models.Article{
			URL:      item.Link,
			Title:    item.Title,
			Summary:  item.Description,
			SourceID: &source.ID,
			Category: source.Category,
		}

		if item.Author != nil {
			a.Author = item.Author.Name
		}

		if item.PublishedParsed != nil {
			a.PublishedAt = item.PublishedParsed
		} else {
			now := time.Now()
			a.PublishedAt = &now
		}

		if item.Image != nil {
			a.ImageURL = item.Image.URL
		}

		a.Summary = item.Description
		// Strip useless HN summary
		if a.Summary == "Comments" ||
			a.Summary == "<p>Comments</p>" ||
			strings.Contains(a.Summary, ">Comments</a>") {
			a.Summary = ""
		}

		articles = append(articles, a)
	}

	return articles, nil
}
