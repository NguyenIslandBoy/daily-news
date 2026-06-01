package api

import (
	"net/http"

	"github.com/NguyenIslandBoy/daily-news/internal/scraper"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(pool *pgxpool.Pool, engine *scraper.Engine, apiKey string, groqAPIKey string) *gin.Engine {
	r := gin.Default()

	articles := NewArticlesHandler(pool, groqAPIKey)
	topics := NewTopicsHandler(pool)
	stats := NewStatsHandler(pool)
	auth := APIKeyAuth(apiKey)
	sources := NewSourcesHandler(pool)

	r.GET("/api/articles", articles.List)
	r.GET("/api/articles/:id", articles.Get)

	r.GET("/api/topics", topics.List)
	r.POST("/api/topics", topics.Create)
	r.PUT("/api/topics/:id", auth, topics.Update)
	r.DELETE("/api/topics/:id", auth, topics.Delete)

	r.GET("/api/stats", stats.Get)

	r.GET("/api/sources", sources.List)

	r.POST("/api/articles/:id/summarize", articles.Summarize)

	r.GET("/api/health", func(c *gin.Context) {
		if err := pool.Ping(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "error",
				"db":     "unreachable",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status":      "ok",
			"db":          "ok",
			"last_scrape": engine.LastScrape(),
		})
	})

	// Serve React frontend static files
	r.Static("/assets", "./static/assets")
	r.StaticFile("/", "./static/index.html")
	r.NoRoute(func(c *gin.Context) {
		c.File("./static/index.html")
	})

	return r
}
