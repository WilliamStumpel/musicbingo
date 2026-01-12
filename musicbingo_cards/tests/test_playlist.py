"""Tests for playlist parsing and validation."""

import json
import tempfile
from pathlib import Path

import pytest

from musicbingo_cards.models import Song
from musicbingo_cards.playlist import (
    Playlist,
    PlaylistError,
    PlaylistParser,
    PlaylistValidationError,
    validate_playlist_size,
)


class TestPlaylist:
    """Tests for Playlist class."""

    def test_create_valid_playlist(self):
        """Test creating a valid playlist."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(50)]
        playlist = Playlist(songs)
        assert len(playlist) == 50
        assert playlist.songs == songs

    def test_playlist_too_small(self):
        """Test that playlist with < 48 songs raises error."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(47)]
        with pytest.raises(PlaylistValidationError, match="too small.*minimum 48"):
            Playlist(songs)

    def test_playlist_too_large(self):
        """Test that playlist with > 200 songs raises error."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(201)]
        with pytest.raises(PlaylistValidationError, match="too large.*maximum 200"):
            Playlist(songs)

    def test_playlist_with_duplicates(self):
        """Test that duplicate songs are detected."""
        songs = [
            Song(title="Same Song", artist="Same Artist"),
            Song(title="Different Song", artist="Artist"),
            Song(title="Same Song", artist="Same Artist"),  # Duplicate
        ] + [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(46)]

        with pytest.raises(PlaylistValidationError, match="duplicate"):
            Playlist(songs)

    def test_playlist_case_insensitive_duplicates(self):
        """Test that duplicates are detected case-insensitively."""
        songs = [
            Song(title="Test Song", artist="Test Artist"),
            Song(title="TEST SONG", artist="TEST ARTIST"),  # Duplicate (different case)
        ] + [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(47)]

        with pytest.raises(PlaylistValidationError, match="duplicate"):
            Playlist(songs)

    def test_playlist_iteration(self):
        """Test iterating over playlist songs."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(50)]
        playlist = Playlist(songs)

        collected = list(playlist)
        assert collected == songs

    def test_playlist_with_metadata(self):
        """Test creating playlist with name and metadata."""
        songs = [Song(title=f"Song {i}", artist=f"Artist {i}") for i in range(50)]
        playlist = Playlist(songs, name="Test Playlist", metadata={"year": 2024})

        assert playlist.name == "Test Playlist"
        assert playlist.metadata["year"] == 2024


class TestPlaylistParserCSV:
    """Tests for CSV playlist parsing."""

    def test_parse_basic_csv(self, tmp_path):
        """Test parsing a basic CSV file."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text(
            "title,artist\n"
            + "\n".join([f"Song {i},Artist {i}" for i in range(50)])
        )

        playlist = PlaylistParser.parse_csv(csv_file)
        assert len(playlist) == 50
        assert playlist.songs[0].title == "Song 0"
        assert playlist.songs[0].artist == "Artist 0"

    def test_parse_csv_with_optional_fields(self, tmp_path):
        """Test parsing CSV with album and duration."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text(
            "title,artist,album,duration\n"
            "Song 1,Artist 1,Album 1,180\n"
            "Song 2,Artist 2,Album 2,200\n"
            + "\n".join([f"Song {i},Artist {i},," for i in range(3, 51)])
        )

        playlist = PlaylistParser.parse_csv(csv_file)
        assert len(playlist) == 50
        assert playlist.songs[0].album == "Album 1"
        assert playlist.songs[0].duration_seconds == 180
        assert playlist.songs[2].album is None

    def test_parse_csv_missing_required_field(self, tmp_path):
        """Test that missing required fields raise error."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text("title,artist\nSong 1,\n")  # Missing artist

        with pytest.raises(PlaylistError, match="Missing required fields"):
            PlaylistParser.parse_csv(csv_file)

    def test_parse_empty_csv(self, tmp_path):
        """Test that empty CSV raises error."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text("title,artist\n")

        with pytest.raises(PlaylistError, match="no valid songs"):
            PlaylistParser.parse_csv(csv_file)

    def test_parse_csv_file_not_found(self):
        """Test that missing file raises error."""
        with pytest.raises(PlaylistError, match="not found"):
            PlaylistParser.parse_csv(Path("/nonexistent/file.csv"))


class TestPlaylistParserJSON:
    """Tests for JSON playlist parsing."""

    def test_parse_json_array(self, tmp_path):
        """Test parsing JSON array format."""
        json_file = tmp_path / "playlist.json"
        songs = [{"title": f"Song {i}", "artist": f"Artist {i}"} for i in range(50)]
        json_file.write_text(json.dumps(songs))

        playlist = PlaylistParser.parse_json(json_file)
        assert len(playlist) == 50
        assert playlist.songs[0].title == "Song 0"

    def test_parse_json_object(self, tmp_path):
        """Test parsing JSON object format with name."""
        json_file = tmp_path / "playlist.json"
        data = {
            "name": "My Playlist",
            "songs": [{"title": f"Song {i}", "artist": f"Artist {i}"} for i in range(50)],
        }
        json_file.write_text(json.dumps(data))

        playlist = PlaylistParser.parse_json(json_file)
        assert len(playlist) == 50
        assert playlist.name == "My Playlist"

    def test_parse_json_with_optional_fields(self, tmp_path):
        """Test parsing JSON with all fields."""
        json_file = tmp_path / "playlist.json"
        songs = [
            {
                "title": "Song 1",
                "artist": "Artist 1",
                "album": "Album 1",
                "duration": 180,
                "metadata": {"year": 2020},
            }
        ] + [{"title": f"Song {i}", "artist": f"Artist {i}"} for i in range(2, 51)]
        json_file.write_text(json.dumps(songs))

        playlist = PlaylistParser.parse_json(json_file)
        assert playlist.songs[0].album == "Album 1"
        assert playlist.songs[0].duration_seconds == 180
        assert playlist.songs[0].metadata["year"] == 2020

    def test_parse_json_missing_required_field(self, tmp_path):
        """Test that missing required fields raise error."""
        json_file = tmp_path / "playlist.json"
        songs = [{"title": "Song 1"}]  # Missing artist
        json_file.write_text(json.dumps(songs))

        with pytest.raises(PlaylistError, match="Missing required fields"):
            PlaylistParser.parse_json(json_file)

    def test_parse_invalid_json(self, tmp_path):
        """Test that invalid JSON raises error."""
        json_file = tmp_path / "playlist.json"
        json_file.write_text("{invalid json")

        with pytest.raises(PlaylistError, match="Invalid JSON"):
            PlaylistParser.parse_json(json_file)

    def test_parse_empty_json(self, tmp_path):
        """Test that empty JSON array raises error."""
        json_file = tmp_path / "playlist.json"
        json_file.write_text("[]")

        with pytest.raises(PlaylistError, match="no valid songs"):
            PlaylistParser.parse_json(json_file)


class TestPlaylistParserTXT:
    """Tests for text playlist parsing."""

    def test_parse_txt_dash_format(self, tmp_path):
        """Test parsing text file with 'Title - Artist' format."""
        txt_file = tmp_path / "playlist.txt"
        txt_file.write_text("\n".join([f"Song {i} - Artist {i}" for i in range(50)]))

        playlist = PlaylistParser.parse_txt(txt_file)
        assert len(playlist) == 50
        assert playlist.songs[0].title == "Song 0"
        assert playlist.songs[0].artist == "Artist 0"

    def test_parse_txt_by_format(self, tmp_path):
        """Test parsing text file with 'Title by Artist' format."""
        txt_file = tmp_path / "playlist.txt"
        txt_file.write_text("\n".join([f"Song {i} by Artist {i}" for i in range(50)]))

        playlist = PlaylistParser.parse_txt(txt_file)
        assert len(playlist) == 50
        assert playlist.songs[0].title == "Song 0"

    def test_parse_txt_with_comments(self, tmp_path):
        """Test that comment lines are skipped."""
        txt_file = tmp_path / "playlist.txt"
        lines = ["# This is a comment", "Song 1 - Artist 1", "", "Song 2 - Artist 2"] + [
            f"Song {i} - Artist {i}" for i in range(3, 51)
        ]
        txt_file.write_text("\n".join(lines))

        playlist = PlaylistParser.parse_txt(txt_file)
        assert len(playlist) == 50

    def test_parse_txt_invalid_format(self, tmp_path):
        """Test that invalid format raises error."""
        txt_file = tmp_path / "playlist.txt"
        txt_file.write_text("Invalid Line Without Separator")

        with pytest.raises(PlaylistError, match="Invalid format"):
            PlaylistParser.parse_txt(txt_file)

    def test_parse_txt_empty_fields(self, tmp_path):
        """Test that empty title or artist raises error."""
        txt_file = tmp_path / "playlist.txt"
        # Create a line that will parse but have empty artist after strip
        txt_file.write_text("Valid Title -  \n")  # Artist will be empty string after strip

        with pytest.raises((PlaylistError, ValueError)):  # Could be either parse or Song validation error
            PlaylistParser.parse_txt(txt_file)

    def test_parse_empty_txt(self, tmp_path):
        """Test that empty text file raises error."""
        txt_file = tmp_path / "playlist.txt"
        txt_file.write_text("")

        with pytest.raises(PlaylistError, match="no valid songs"):
            PlaylistParser.parse_txt(txt_file)


class TestPlaylistParserAutoDetect:
    """Tests for automatic format detection."""

    def test_auto_detect_csv(self, tmp_path):
        """Test auto-detecting CSV format."""
        csv_file = tmp_path / "playlist.csv"
        csv_file.write_text(
            "title,artist\n" + "\n".join([f"Song {i},Artist {i}" for i in range(50)])
        )

        playlist = PlaylistParser.parse_file(csv_file)
        assert len(playlist) == 50

    def test_auto_detect_json(self, tmp_path):
        """Test auto-detecting JSON format."""
        json_file = tmp_path / "playlist.json"
        songs = [{"title": f"Song {i}", "artist": f"Artist {i}"} for i in range(50)]
        json_file.write_text(json.dumps(songs))

        playlist = PlaylistParser.parse_file(json_file)
        assert len(playlist) == 50

    def test_auto_detect_txt(self, tmp_path):
        """Test auto-detecting text format."""
        txt_file = tmp_path / "playlist.txt"
        txt_file.write_text("\n".join([f"Song {i} - Artist {i}" for i in range(50)]))

        playlist = PlaylistParser.parse_file(txt_file)
        assert len(playlist) == 50

    def test_unsupported_format(self, tmp_path):
        """Test that unsupported format raises error."""
        file = tmp_path / "playlist.xml"
        file.write_text("<songs></songs>")

        with pytest.raises(PlaylistError, match="Unsupported.*format"):
            PlaylistParser.parse_file(file)

    def test_file_not_found(self):
        """Test that missing file raises error."""
        with pytest.raises(PlaylistError, match="not found"):
            PlaylistParser.parse_file("/nonexistent/file.csv")


class TestValidatePlaylistSize:
    """Tests for playlist size validation."""

    def test_quick_game(self):
        """Test classification of quick game (48-59 songs)."""
        assert validate_playlist_size(48) == "quick"
        assert validate_playlist_size(55) == "quick"
        assert validate_playlist_size(59) == "quick"

    def test_standard_game(self):
        """Test classification of standard game (60-74 songs)."""
        assert validate_playlist_size(60) == "standard"
        assert validate_playlist_size(65) == "standard"
        assert validate_playlist_size(74) == "standard"

    def test_marathon_game(self):
        """Test classification of marathon game (75+ songs)."""
        assert validate_playlist_size(75) == "marathon"
        assert validate_playlist_size(100) == "marathon"
        assert validate_playlist_size(200) == "marathon"

    def test_too_small(self):
        """Test that < 48 songs raises error."""
        with pytest.raises(PlaylistValidationError, match="too small"):
            validate_playlist_size(47)

    def test_too_large(self):
        """Test that > 200 songs raises error."""
        with pytest.raises(PlaylistValidationError, match="too large"):
            validate_playlist_size(201)
