"""Tests for CSV import from Exportify format."""

import pytest
from pathlib import Path
import tempfile
import csv

from musicbingo_cards.csv_import import (
    parse_exportify_csv,
    create_game_from_csv,
    generate_song_id,
)


class TestGenerateSongId:
    def test_consistent_ids(self):
        """Same title/artist should produce same ID."""
        id1 = generate_song_id("Never Gonna Give You Up", "Rick Astley")
        id2 = generate_song_id("Never Gonna Give You Up", "Rick Astley")
        assert id1 == id2

    def test_case_insensitive(self):
        """IDs should be case-insensitive."""
        id1 = generate_song_id("SONG TITLE", "ARTIST")
        id2 = generate_song_id("song title", "artist")
        assert id1 == id2

    def test_different_songs_different_ids(self):
        """Different songs should have different IDs."""
        id1 = generate_song_id("Song A", "Artist 1")
        id2 = generate_song_id("Song B", "Artist 2")
        assert id1 != id2


class TestParseExportifyCsv:
    def test_basic_import(self, tmp_path):
        """Test importing a basic CSV with required columns."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text(
            'Track Name,Artist Name(s),Album Name\n'
            'Song One,Artist A,Album X\n'
            'Song Two,Artist B,Album Y\n'
        )

        songs = parse_exportify_csv(csv_file)

        assert len(songs) == 2
        assert songs[0]['title'] == 'Song One'
        assert songs[0]['artist'] == 'Artist A'
        assert songs[1]['title'] == 'Song Two'

    def test_with_optional_fields(self, tmp_path):
        """Test importing CSV with optional fields."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text(
            'Track Name,Artist Name(s),Album Name,Track Duration (ms),ISRC\n'
            'Song One,Artist A,Album X,180000,USRC12345678\n'
        )

        songs = parse_exportify_csv(csv_file)

        assert songs[0]['album'] == 'Album X'
        assert songs[0]['duration_ms'] == 180000
        assert songs[0]['isrc'] == 'USRC12345678'

    def test_missing_required_column(self, tmp_path):
        """Test error when required column is missing."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text(
            'Track Name,Album Name\n'
            'Song One,Album X\n'
        )

        with pytest.raises(ValueError, match="Artist Name"):
            parse_exportify_csv(csv_file)

    def test_skips_empty_rows(self, tmp_path):
        """Test that rows with empty title/artist are skipped."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text(
            'Track Name,Artist Name(s)\n'
            'Song One,Artist A\n'
            ',Artist B\n'
            'Song Three,\n'
            'Song Four,Artist D\n'
        )

        songs = parse_exportify_csv(csv_file)

        assert len(songs) == 2
        assert songs[0]['title'] == 'Song One'
        assert songs[1]['title'] == 'Song Four'

    def test_file_not_found(self):
        """Test error when file doesn't exist."""
        with pytest.raises(FileNotFoundError):
            parse_exportify_csv(Path("/nonexistent/file.csv"))


class TestCreateGameFromCsv:
    def test_creates_game_structure(self, tmp_path):
        """Test that game structure is correct."""
        csv_file = tmp_path / "playlist.csv"

        # Create CSV with enough songs
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Track Name', 'Artist Name(s)'])
            for i in range(30):
                writer.writerow([f'Song {i}', f'Artist {i}'])

        game = create_game_from_csv(csv_file, "Test Game")

        assert game['game_name'] == 'Test Game'
        assert game['song_count'] == 30
        assert len(game['songs']) == 30

    def test_too_few_songs(self, tmp_path):
        """Test error when playlist has fewer than 24 songs."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text(
            'Track Name,Artist Name(s)\n'
            'Song One,Artist A\n'
            'Song Two,Artist B\n'
        )

        with pytest.raises(ValueError, match="at least 24"):
            create_game_from_csv(csv_file, "Test Game")

    def test_writes_output_file(self, tmp_path):
        """Test that output file is written correctly."""
        csv_file = tmp_path / "playlist.csv"
        output_file = tmp_path / "game.json"

        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Track Name', 'Artist Name(s)'])
            for i in range(30):
                writer.writerow([f'Song {i}', f'Artist {i}'])

        create_game_from_csv(csv_file, "Test Game", output_file)

        assert output_file.exists()

        import json
        with open(output_file) as f:
            data = json.load(f)

        assert data['game_name'] == 'Test Game'
        assert len(data['songs']) == 30
