library(ggplot2)

setwd(this.path::this.dir())

# Create icon plot
icon_sort_down <- function(filename, t = "A", b = "Z", width = 1, text_x = 12) {
  p <- ggplot() +

    # Arrow
    geom_segment(
      aes(x = 3, y = 15.5, yend = 0.5),
      lineend = "round", linewidth = 2.5,
      arrow = arrow(angle = 45, length = unit(0.2, "inches"))
    ) +

    # Letters on top and bottom
    annotate("text", x = text_x, y = c(12.5, 3.7), label = c(t, b),
             size = 14, fontface = "bold", family = "Arial") +

    # Coordinate and theme setup
    coord_fixed(xlim = c(0, 16 * width), ylim = c(0, 16)) +
    theme_void() +
    theme(
      plot.background = element_blank(),
      panel.background = element_blank()
    )

  ggsave(filename, p, width = width, height = 1)
}

icon_sort_down("sort-alpha-a-z.svg", "A", "Z", width = 1) |>
  preview::preview(zoom = 1)

icon_sort_down("sort-timestamp-new-old.svg", "New", "Old", width = 1.75, text_x = 18) |>
  preview::preview(zoom = 1)
