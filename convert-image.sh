


# magick icon.svg icon.png && 

magick icon.png -resize 32x32 -background none -alpha on 32x32.png && magick icon.png -resize 128x128 -background none -alpha on 128x128.png && magick icon.png -resize 256x256 -background none -alpha on 128x128@2x.png && magick icon.png -resize 512x512 -background none -alpha on icon.icns && magick icon.png -resize 256x256 -background none -alpha on icon.ico && ls -la


magick icon.png -resize 32x32 PNG32:32x32.png && magick icon.png -resize 128x128 PNG32:128x128.png && magick icon.png -resize 256x256 PNG32:128x128@2x.png && file 32x32.png 128x128.png 128x128@2x.png

