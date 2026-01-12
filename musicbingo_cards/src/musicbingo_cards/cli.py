"""Command-line interface for Music Bingo card generation."""

import click


@click.group()
@click.version_option()
def main():
    """Music Bingo card generation tool.

    Generate unique bingo cards from playlists with QR codes and PDF export.
    """
    pass


@main.command()
@click.argument("playlist_file", type=click.Path(exists=True))
@click.option(
    "--num-cards",
    "-n",
    type=int,
    default=50,
    help="Number of unique cards to generate (50-200)",
)
@click.option(
    "--output",
    "-o",
    type=click.Path(),
    default="cards.pdf",
    help="Output PDF file path",
)
@click.option("--venue-logo", type=click.Path(exists=True), help="Venue logo image file")
@click.option("--dj-contact", type=str, help="DJ contact information")
def generate(playlist_file, num_cards, output, venue_logo, dj_contact):
    """Generate bingo cards from a playlist.

    PLAYLIST_FILE: Path to playlist file (format TBD)
    """
    click.echo(f"Generating {num_cards} cards from {playlist_file}")
    click.echo(f"Output: {output}")

    # TODO: Implement card generation
    click.secho("Card generation not yet implemented", fg="yellow")


@main.command()
def validate():
    """Validate playlist and card generation setup."""
    click.echo("Running validation checks...")

    # TODO: Implement validation
    click.secho("Validation not yet implemented", fg="yellow")


if __name__ == "__main__":
    main()
