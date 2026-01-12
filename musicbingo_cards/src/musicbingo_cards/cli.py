"""Command-line interface for Music Bingo card generation."""

import sys

import click

from .playlist import PlaylistError, PlaylistParser, validate_playlist_size


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

    PLAYLIST_FILE: Path to playlist file (CSV, JSON, or TXT format)

    Supported formats:
    \b
    - CSV: title,artist[,album][,duration]
    - JSON: [{"title": "...", "artist": "..."}, ...]
    - TXT: Title - Artist (one per line)
    """
    click.echo(f"📋 Loading playlist from {playlist_file}...")

    # Parse playlist
    try:
        playlist = PlaylistParser.parse_file(playlist_file)
        click.secho(f"✓ Loaded {len(playlist)} songs", fg="green")

        # Determine game type
        game_type = validate_playlist_size(len(playlist))
        click.echo(f"Game type: {game_type} ({len(playlist)} songs)")

    except PlaylistError as e:
        click.secho(f"✗ Error loading playlist: {e}", fg="red", err=True)
        sys.exit(1)

    # Validate card count
    if num_cards < 50 or num_cards > 200:
        click.secho(
            f"✗ Invalid card count: {num_cards}. Must be between 50-200",
            fg="red",
            err=True
        )
        sys.exit(1)

    click.echo(f"\n🎲 Generating {num_cards} unique bingo cards...")
    click.echo(f"Output: {output}")

    if venue_logo:
        click.echo(f"Venue logo: {venue_logo}")
    if dj_contact:
        click.echo(f"DJ contact: {dj_contact}")

    # TODO: Implement card generation algorithm
    click.secho("\n⚠ Card generation algorithm not yet implemented", fg="yellow")
    click.echo("\nNext steps:")
    click.echo("  1. Implement card generation algorithm (30-40% song overlap)")
    click.echo("  2. Generate QR codes for each card")
    click.echo("  3. Create PDF with cards")


@main.command()
@click.argument("playlist_file", type=click.Path(exists=True))
def validate(playlist_file):
    """Validate a playlist file.

    PLAYLIST_FILE: Path to playlist file to validate
    """
    click.echo(f"📋 Validating playlist: {playlist_file}\n")

    try:
        playlist = PlaylistParser.parse_file(playlist_file)
        click.secho(f"✓ Format: Valid", fg="green")
        click.secho(f"✓ Songs: {len(playlist)}", fg="green")

        # Determine game type and recommendations
        game_type = validate_playlist_size(len(playlist))
        click.secho(f"✓ Game type: {game_type}", fg="green")

        # Recommendations
        click.echo("\n📊 Recommendations:")
        if len(playlist) < 60:
            click.echo("  • Quick game (48-59 songs) - Good for shorter events")
            click.echo(f"  • Can generate ~{len(playlist) * 2} unique cards")
        elif len(playlist) < 75:
            click.echo("  • Standard game (60-74 songs) - Most common")
            click.echo(f"  • Can generate ~{len(playlist) * 2} unique cards")
        else:
            click.echo("  • Marathon game (75+ songs) - Longer events")
            click.echo(f"  • Can generate ~{len(playlist) * 2} unique cards")

        # Show sample songs
        click.echo("\n🎵 Sample songs:")
        for i, song in enumerate(list(playlist)[:5], 1):
            click.echo(f"  {i}. {song.title} - {song.artist}")
        if len(playlist) > 5:
            click.echo(f"  ... and {len(playlist) - 5} more")

        click.echo("\n✓ Playlist is valid and ready for card generation!")

    except PlaylistError as e:
        click.secho(f"\n✗ Validation failed: {e}", fg="red", err=True)
        click.echo("\nTroubleshooting:")
        click.echo("  • Check file format (CSV, JSON, or TXT)")
        click.echo("  • Ensure all songs have title and artist")
        click.echo("  • Verify playlist has 48-200 songs")
        click.echo("  • Remove any duplicate songs")
        sys.exit(1)


if __name__ == "__main__":
    main()
