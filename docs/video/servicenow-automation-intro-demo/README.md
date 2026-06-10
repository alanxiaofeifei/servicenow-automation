# ServiceNow Automation intro/demo video

HyperFrames source for the no-voice English introduction/demo video used by the public GitHub project page.

## Output

Final rendered assets are copied to:

- `docs/assets/video/servicenow-automation-v0.1.0-intro-demo.mp4`
- `docs/assets/video/servicenow-automation-v0.1.0-intro-demo-thumb.jpg`

## Creative direction

- English text only.
- No voiceover.
- Original synthesized background music generated locally by `scripts_generate_music.py`.
- Uses repaired/local demo UI screenshots from `docs/assets/ui/`, not bug-report screenshots and not real ServiceNow/customer data.
- Makes the public-test-preview boundary explicit: local demo data, human review, no real ServiceNow save/submit/update/close, no Microsoft Graph or Excel Web writeback.

## Re-render

From this directory:

```bash
/home/alanxwsl/.nvm/versions/node/v24.16.0/bin/hyperframes lint
/home/alanxwsl/.nvm/versions/node/v24.16.0/bin/hyperframes inspect --samples 12
/home/alanxwsl/.nvm/versions/node/v24.16.0/bin/hyperframes render --fps 30 --quality high --workers 2 --output ../../assets/video/servicenow-automation-v0.1.0-intro-demo.mp4
```
