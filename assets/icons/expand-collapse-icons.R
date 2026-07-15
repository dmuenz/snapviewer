library(ggplot2)
library(ggforce)
library(tibble)

setwd(this.path::this.dir())

# Function to create rounded step data
rounded_step <- function(x, y, radius = 0.1, direction = "hv") {
  n <- length(x)

  # Expand direction to a vector of length n-1 (one per segment)
  if (length(direction) == 1) {
    direction <- rep(direction, n - 1)
  }
  stopifnot(length(direction) >= n - 1)
  stopifnot(all(direction %in% c("hv", "vh")))

  pts <- data.frame(x = numeric(0), y = numeric(0))

  for (i in 1:(n - 1)) {
    x_curr <- x[i]
    x_next <- x[i + 1]
    y_curr <- y[i]
    y_next <- y[i + 1]
    dir <- direction[i]

    dx <- abs(x_next - x_curr)
    dy <- abs(y_next - y_curr)

    if (dx == 0 || dy == 0) {
      # Straight line, no corner needed
      pts <- rbind(pts, data.frame(x = x_curr, y = y_curr))
    } else {
      # Clamp radius to half the available distance in each axis
      r <- min(radius, dx / 2, dy / 2)

      dir_x <- sign(x_next - x_curr)
      dir_y <- sign(y_next - y_curr)

      # Quarter circle for the corner
      theta <- seq(0, pi / 2, length.out = 20)

      if (dir == "hv") {
        # Horizontal first, then vertical
        # Corner is at (x_next, y_curr), curving toward (x_next, y_next)
        pts <- rbind(pts, data.frame(
          x = c(x_curr, x_next - dir_x * r),
          y = c(y_curr, y_curr)
        ))
        # Arc from end of horizontal to start of vertical
        cx <- x_next - dir_x * r + dir_x * r * sin(theta)
        cy <- y_curr + dir_y * r * (1 - cos(theta))
        pts <- rbind(pts, data.frame(x = cx, y = cy))
        # Vertical segment after the corner
        pts <- rbind(pts, data.frame(
          x = c(x_next, x_next),
          y = c(y_curr + dir_y * r, y_next)
        ))

      } else {
        # Vertical first, then horizontal
        # Corner is at (x_curr, y_next), curving toward (x_next, y_next)
        pts <- rbind(pts, data.frame(
          x = c(x_curr, x_curr),
          y = c(y_curr, y_next - dir_y * r)
        ))
        # Arc from end of vertical to start of horizontal
        cx <- x_curr + dir_x * r * (1 - cos(theta))
        cy <- y_next - dir_y * r + dir_y * r * sin(theta)
        pts <- rbind(pts, data.frame(x = cx, y = cy))
        # Horizontal segment after the corner
        pts <- rbind(pts, data.frame(
          x = c(x_curr + dir_x * r, x_next),
          y = c(y_next, y_next)
        ))
      }
    }
  }

  # Add final point
  rbind(pts, data.frame(x = x[n], y = y[n]))
}

# Create icon plot
icon_folder <- function(filename, symbol) {

  box_size <- 10
  offset <- 1

  rescale <- function(df) {
    df$x <- df$x * box_size + (16 - box_size) / 2 - offset
    df$y <- df$y * box_size + (16 - box_size) / 2 + offset
    df
  }

  outer_box_path <- tribble(
    ~x,  ~y,   ~dir,
    0,    0.1,  "vh",
    0.1,  0,    "hv",
    0.9,  0,    "hv",
    1,    0.1,  "hv",
    1,    0.9,  "vh",
    0.9,  1,    "hv"
  ) |> rescale()
  outer_box_path$x <- outer_box_path$x + 1.8
  outer_box_path$y <- outer_box_path$y - 1.8

  outer_box_path <- rounded_step(
    outer_box_path$x,
    outer_box_path$y,
    direction = outer_box_path$dir,
    radius = 1)

  symbol_len <- 6

  p <- ggplot() +

    # Rounded rect
    geom_shape(
      data = data.frame(
        x = c(0, 1, 1, 0),
        y = c(0, 0, 1, 1)
      ) |> rescale(),
      mapping = aes(x = x, y = y),
      fill = NA,
      color = "black",
      linewidth = 2.5,
      radius = 0.05
    ) +

    # Partial rounded rect
    geom_path(
      data = outer_box_path,
      mapping = aes(x = x, y = y),
      color = "black",
      linewidth = 2.5
    ) +

    # Horizontal line, i.e., minus sign
    annotate("segment",
             x = 8 - offset - symbol_len / 2,
             xend = 8 - offset + symbol_len / 2,
             y = 8 + offset,
             color = "black",
             linewidth = 2.5) +

    # Vertical line, turning the minus into a plus
    (if (symbol == "+") {
      annotate("segment",
               y = 8 + offset - symbol_len / 2,
               yend = 8 + offset + symbol_len / 2,
               x = 8 - offset,
               color = "black",
               linewidth = 2.5)
    }) +

    # Coordinate and theme setup
    coord_fixed(xlim = c(0, 16), ylim = c(0, 16)) +
    theme_void() +
    theme(
      plot.background = element_blank(),
      panel.background = element_blank()
    )

  ggsave(filename, p, width = 1, height = 1)
}

icon_folder("expand-all.svg", "+") |>
  preview::preview(zoom = 1)

icon_folder("collapse-all.svg", "-") |>
  preview::preview(zoom = 1)
