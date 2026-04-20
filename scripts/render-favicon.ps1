# Re-scale the user-provided favicon source (64x64 JPEG) up to proper
# raster sizes (192x192 and 180x180) and save them as real PNG files.
# High-quality bicubic interpolation preserves the shape as best as
# possible from the small source.  For perfect edges we rely on the
# accompanying favicon.svg (vectorial, used by modern browsers).

Add-Type -AssemblyName System.Drawing

$src = "C:\Users\rsbms\.cursor\projects\c-Users-rsbms-Documents-aeroMatch\assets\c__Users_rsbms_AppData_Roaming_Cursor_User_workspaceStorage_e51f180df9f10738e117b3a0b474d76b_images_favicon-3b35d693-7dc1-46e8-befe-e6edcdec0236.png"

function Resize-Image {
    param(
        [string]$SourcePath,
        [string]$OutPath,
        [int]$Size
    )

    $original = [System.Drawing.Image]::FromFile($SourcePath)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($original, 0, 0, $Size, $Size)
    $g.Dispose()
    $original.Dispose()
    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved: $OutPath ($Size x $Size)"
}

$publicDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'public'
Resize-Image -SourcePath $src -OutPath (Join-Path $publicDir 'favicon.png')       -Size 192
Resize-Image -SourcePath $src -OutPath (Join-Path $publicDir 'apple-touch-icon.png') -Size 180
Resize-Image -SourcePath $src -OutPath (Join-Path $publicDir 'favicon-96.png')    -Size 96
Resize-Image -SourcePath $src -OutPath (Join-Path $publicDir 'favicon-32.png')    -Size 32
# favicon.ico: keep the 32x32 as .ico for legacy compatibility.
Resize-Image -SourcePath $src -OutPath (Join-Path $publicDir 'favicon.ico')       -Size 32
