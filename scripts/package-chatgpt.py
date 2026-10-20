#!/usr/bin/env python3
"""Deterministic allowlist-only plugin ZIP; no dependencies, credentials or build output."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
FILES = ['plugin.json', 'mcp.json', 'assets/chatgpt-icon.png']

def package(destination):
    manifest = json.loads((ROOT / 'plugin.json').read_text())
    mcp = json.loads((ROOT / 'mcp.json').read_text())
    assert manifest['name'] == 'legalaimcp'
    presentation = manifest['extensions']['com.openai']['interface']
    assert len(presentation['displayName']) <= 30
    assert len(presentation['shortDescription']) <= 30
    assert len(presentation['longDescription']) <= 4000
    cases = manifest['extensions']['com.openai']['review']['test_cases']
    assert len(cases['positive']) == 5 and len(cases['negative']) == 3
    for case in cases['positive']:
        assert all(case.get(key) for key in ['description', 'prompt', 'tools_triggered', 'expected_behavior'])
    assert mcp['mcpServers']['legalaimcp']['url'] == 'https://legalaimcp.com/api/mcp'
    assert mcp['mcpServers']['legalaimcp']['type'] == 'streamable-http'
    destination.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(destination, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for name in sorted(FILES):
            source = ROOT / name
            if source.is_symlink() or not source.is_file():
                raise ValueError('Package source missing or symlink: ' + name)
            payload = source.read_bytes()
            for forbidden in [b'/Users/', b'SUPABASE_SERVICE_ROLE_KEY=', b'sk_live_', b'sk_test_', b'BEGIN PRIVATE KEY']:
                if forbidden in payload:
                    raise ValueError('Private data marker in package source: ' + name)
            info = ZipInfo(name, (2026, 10, 20, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, payload)
    with ZipFile(destination) as archive:
        assert archive.testzip() is None
        assert sorted(archive.namelist()) == sorted(FILES)
    print(json.dumps({'artifact': destination.name, 'files': len(FILES), 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest()}))

if __name__ == '__main__':
    package(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist' / 'legalaimcp-chatgpt-1.1.0.zip')
