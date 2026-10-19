# darshandeshpande.github.io

Personal site for Darshan Deshpande. Built with Jekyll, so GitHub Pages
renders it directly from this repository — no build step, no Node, no CI.

## Publishing (once)

1. Create a **public** repository on GitHub named exactly `darshandeshpande.github.io`.
2. Push this folder to its `main` branch.
3. In the repo, open **Settings → Pages** and set *Source* to
   **Deploy from a branch**, branch `main`, folder `/ (root)`.

The site appears at <https://darshandeshpande.github.io> within a minute or two.
Every later `git push` republishes it.

## Updating

Everything you'd normally change is data, not markup:

| To change… | Edit |
|---|---|
| Your bio | `index.md` (plain Markdown) |
| The "Re:" line under the date | `_data/about.yml` |
| A paper (add, reorder, add links) | `_data/publications.yml`; add `selected: true` to list it on the letter |
| A talk (put its photo in `assets/img/talks/`) | `_data/talks.yml` |
| Education | `_data/education.yml` |
| Tangents (handwritten idea notebooks) | export the notes as a PDF, run `python3 _tools/tangents_pdf_to_svg.py "<pdf>" assets/tangents/notebook-N` (cuts it into one slip per numbered idea), then add the lines it prints to `_data/tangents.yml`. No typed text of the ideas goes on the page, and `robots.txt` asks AI crawlers to stay out of `/tangents/`. |
| Role, city, email, profile links | `_config.yml` |
| Tabs in the top bar | `nav:` in `_config.yml` (About is always first; CV appears once `assets/cv.pdf` exists) |
| Hills named on the map | `landmarks:` in `_config.yml` |
| Colors and fonts | tokens at the top of `assets/css/style.css` |

### How the site is put together

Every page has a top bar with your name and the tabs (About,
Publications, Talks, and CV once it exists). Behind everything is a
contour map of San Francisco's hills that stays still while the page
scrolls; the content sits on a sheet of paper lying on top of it. On wide
screens the margins show Twin Peaks, Mt Davidson and Bernal Heights,
labelled; on phones the map shows around the sheet's edges. On the first
page of a visit the lines trace outward from the peaks once (never for
people with reduced motion turned on). `assets/js/site.js` draws the map;
the page reads fine without it.

The home page is a short letter; Publications and Talks are
"Enclosure A" and "Enclosure B".

### Adding a paper

Append an entry to `_data/publications.yml`:

```yaml
- title: "Paper Title"
  authors: "Darshan Deshpande, Coauthor One, Coauthor Two"
  venue: "NeurIPS 2026"
  year: 2026
  arxiv: "2609.01234"          # any of these link fields are optional
  code: https://github.com/…
  selected: true               # also list it on the letter
```

Papers are grouped by year (newest first) and appear in the order listed
within a year. Your name is underlined in author lists automatically.

### Photo and CV

- The clipped photo on the letter is `assets/img/photo.jpg`. Replace the
  file to change it, delete it to remove the print.
- Drop a PDF at `assets/cv.pdf` and a CV tab appears in the top bar.

## Previewing locally (optional)

You don't need this to publish, but if you want to see changes before pushing:

```sh
brew install ruby                       # once — macOS's built-in Ruby is too old
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
gem install bundler && bundle install   # once
bundle exec jekyll serve --livereload   # then open http://localhost:4000
```

Local previews use Jekyll 4; GitHub Pages builds with its own Jekyll 3.9.
The site uses only features common to both, so they render identically.
