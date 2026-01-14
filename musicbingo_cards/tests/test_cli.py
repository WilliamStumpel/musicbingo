"""Tests for CLI functionality."""

import tempfile
from pathlib import Path

import pytest
from click.testing import CliRunner

from musicbingo_cards.cli import main
from musicbingo_cards.models import Song
from musicbingo_cards.playlist import Playlist


def test_cli_version():
    """Test CLI version command."""
    runner = CliRunner()
    result = runner.invoke(main, ["--version"])
    assert result.exit_code == 0
    assert "version" in result.output.lower()


def test_cli_help():
    """Test CLI help command."""
    runner = CliRunner()
    result = runner.invoke(main, ["--help"])
    assert result.exit_code == 0
    assert "Music Bingo" in result.output


def test_generate_help():
    """Test generate command help."""
    runner = CliRunner()
    result = runner.invoke(main, ["generate", "--help"])
    assert result.exit_code == 0
    assert "playlist" in result.output.lower()
    assert "num-cards" in result.output


def test_validate_help():
    """Test validate command help."""
    runner = CliRunner()
    result = runner.invoke(main, ["validate", "--help"])
    assert result.exit_code == 0


@pytest.fixture
def sample_playlist_file():
    """Create a sample playlist file for testing."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        # Write 60 songs for a standard game
        for i in range(60):
            f.write(f"Song {i} - Artist {i}\n")
        temp_path = f.name

    yield temp_path

    # Cleanup
    Path(temp_path).unlink(missing_ok=True)


def test_generate_with_defaults(sample_playlist_file):
    """Test generate command with default options."""
    runner = CliRunner()
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = Path(tmpdir) / "test_cards.pdf"

        result = runner.invoke(
            main, ["generate", sample_playlist_file, "-o", str(output_path)]
        )

        assert result.exit_code == 0
        assert "Loaded 60 songs" in result.output
        assert "Generated 50 unique cards" in result.output
        assert "PDF created successfully" in result.output
        assert output_path.exists()


def test_generate_with_custom_card_count(sample_playlist_file):
    """Test generate command with custom card count."""
    runner = CliRunner()
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = Path(tmpdir) / "test_cards.pdf"

        result = runner.invoke(
            main,
            [
                "generate",
                sample_playlist_file,
                "-n",
                "75",
                "-o",
                str(output_path),
            ],
        )

        assert result.exit_code == 0
        assert "Generated 75 unique cards" in result.output
        assert output_path.exists()


def test_generate_with_seed(sample_playlist_file):
    """Test generate command with random seed."""
    runner = CliRunner()
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = Path(tmpdir) / "test_cards.pdf"

        result = runner.invoke(
            main,
            [
                "generate",
                sample_playlist_file,
                "-n",
                "50",
                "-s",
                "42",
                "-o",
                str(output_path),
            ],
        )

        assert result.exit_code == 0
        assert "Random seed: 42" in result.output
        assert "Generated 50 unique cards" in result.output


def test_generate_invalid_card_count(sample_playlist_file):
    """Test generate command with invalid card count."""
    runner = CliRunner()
    # Test count > 1000 (the new max)
    result = runner.invoke(
        main, ["generate", sample_playlist_file, "-n", "1001", "-o", "output.pdf"]
    )

    assert result.exit_code != 0
    assert "Invalid card count" in result.output


def test_generate_missing_file():
    """Test generate command with missing playlist file."""
    runner = CliRunner()
    result = runner.invoke(main, ["generate", "nonexistent.txt"])

    assert result.exit_code != 0


def test_generate_shows_overlap_stats(sample_playlist_file):
    """Test that generate command shows overlap statistics."""
    runner = CliRunner()
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = Path(tmpdir) / "test_cards.pdf"

        result = runner.invoke(
            main, ["generate", sample_playlist_file, "-o", str(output_path)]
        )

        assert result.exit_code == 0
        assert "Average overlap:" in result.output
        assert "Target range: 30-40%" in result.output


def test_validate_command(sample_playlist_file):
    """Test validate command with valid playlist."""
    runner = CliRunner()
    result = runner.invoke(main, ["validate", sample_playlist_file])

    assert result.exit_code == 0
    assert "Songs: 60" in result.output
    assert "Playlist is valid" in result.output


def test_validate_command_shows_samples(sample_playlist_file):
    """Test that validate shows sample songs."""
    runner = CliRunner()
    result = runner.invoke(main, ["validate", sample_playlist_file])

    assert result.exit_code == 0
    assert "Sample songs:" in result.output
    assert "Song 0 - Artist 0" in result.output
