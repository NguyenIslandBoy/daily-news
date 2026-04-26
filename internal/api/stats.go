package api

import (
	"net/http"

	"github.com/NguyenIslandBoy/daily-news/internal/db"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type StatsHandler struct {
	pool *pgxpool.Pool
}

func NewStatsHandler(pool *pgxpool.Pool) *StatsHandler {
	return &StatsHandler{pool: pool}
}

func (h *StatsHandler) Get(c *gin.Context) {
	stats, err := db.GetStats(h.pool)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}
	c.Header("Cache-Control", "max-age=3600")
	c.JSON(http.StatusOK, stats)
}
