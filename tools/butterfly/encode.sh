#!/bin/sh
# The rendered butterfly frames (render_model.py) into the site's video and poster.
# The frame is wide enough for the soft shadow to fade out inside it (render_model.py, FRAME);
# what little is left at the border (under 1%, render noise) eases to exactly nothing toward the
# edges (left, right and bottom over the outer 20%, the top over 8%), so no edge can ever show
# on the light page. The butterfly never comes into those margins (the build's --check:
# x 0.35-0.65, y 0.34-0.74). 1728 x 1440: the butterfly keeps the pixels it had at 1080 x 900.
#   sh tools/butterfly/encode.sh
set -e
cd "$(dirname "$0")/../.."
R=_media-originals/butterfly/render
O=public/media/butterfly
FF=/opt/homebrew/bin/ffmpeg
s() { echo "(clip($1,0,1)*clip($1,0,1)*(3-2*clip($1,0,1)))"; }  # smoothstep
FADE="$(s "X/(0.2*W)")*$(s "(W-1-X)/(0.2*W)")*$(s "(H-1-Y)/(0.2*H)")*$(s "Y/(0.08*H)")"
VF="format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='alpha(X,Y)*$FADE',scale=1728:1440:flags=lanczos"
mkdir -p $O
$FF -y -loglevel error -framerate 30 -start_number 0 -i $R/%04d.png -vf "$VF" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -crf 30 -b:v 0 -row-mt 1 -an $O/butterfly.webm
$FF -y -loglevel error -framerate 30 -start_number 0 -i $R/%04d.png -vf "$VF" \
  -c:v hevc_videotoolbox -allow_sw 1 -alpha_quality 0.75 -b:v 3000k -tag:v hvc1 -pix_fmt bgra -an $O/butterfly.mov
# ffmpeg here has no WebP encoder: the poster (frame 0, the same fade) goes through PNG and Blender
# (scaled to its own size first: Blender saves an untouched image in the format it came in)
$FF -y -loglevel error -i $R/0000.png -vf "$VF" -frames:v 1 /tmp/butterfly-poster.png
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-expr \
  "import bpy,os; i=bpy.data.images.load('/tmp/butterfly-poster.png'); i.scale(*i.size); i.file_format='WEBP'; i.save(filepath=os.path.abspath('$O/poster.webp'), quality=85)" >/dev/null
rm /tmp/butterfly-poster.png
ls -la $O
