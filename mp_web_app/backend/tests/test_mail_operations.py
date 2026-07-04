"""Tests for mail/operations.py — render_template and notification routing."""

import os
import tempfile
from pathlib import Path
from unittest.mock import Mock, call, patch

import pytest

from mail.operations import render_template


class TestRenderTemplate:
  def test_substitutes_variables(self, tmp_path, monkeypatch):
    template = tmp_path / "test.html"
    template.write_text("<p>{greeting}, {name}!</p>", encoding="utf-8")

    import mail.operations as mail_ops
    monkeypatch.setattr(mail_ops, "_TEMPLATES_DIR", tmp_path)

    result = render_template("test.html", greeting="Здравейте", name="Иван")

    assert result == "<p>Здравейте, Иван!</p>"

  def test_raises_file_not_found_for_missing_template(self, tmp_path, monkeypatch):
    import mail.operations as mail_ops
    monkeypatch.setattr(mail_ops, "_TEMPLATES_DIR", tmp_path)

    with pytest.raises(FileNotFoundError, match="missing.html"):
      render_template("missing.html")

  def test_returns_content_unchanged_when_no_variables(self, tmp_path, monkeypatch):
    template = tmp_path / "static.html"
    template.write_text("<p>Статичен текст</p>", encoding="utf-8")

    import mail.operations as mail_ops
    monkeypatch.setattr(mail_ops, "_TEMPLATES_DIR", tmp_path)

    result = render_template("static.html")

    assert result == "<p>Статичен текст</p>"
