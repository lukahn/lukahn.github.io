---
layout:     post
title:      Working with subtitles
date:       2021-06-20 12:30:00
author:     Luke Wakefield
summary:    A list of tasks for managing subtitles in video files.
categories: website
thumbnail: heart
tags:
 - subtitles
 - ffmpeg
 - youtube-dl
 - AnyStream
 - ExpressVPN
 - Netflix
 - Amazon
---

I'm a big fan of subtitles, and find that it's useful in making sure that I don't miss any dialog, or so I can watch a 
video without audio. Below are some of the slightly more unusual tasks I've done when working with subtitles. 
**NOTE:** This is for `.MP4` files. It may work with other formats, but I've not tested it. For `.MKV` files, it's 
recommended to use [**MKVToolNix**][MKVToolNix], and maybe [**this**][MKV guide] guide.

<br>
# Adding a subtitle to a video

This guide was initially going to document how to force subtitles to be on/off by default, however, after testing 
again, I'm not able to reproduce the problem. It could be an old setting with VLC, or it could be confusion with 
the `.MKV` format (which does seem to play subtitles by default). Either way, here are the ways of manually adding 
a simple subtitle file (SubRip/srt) to an mp4 video.

### Simple
[**Source**][subtitle foreground]
```
ffmpeg -i video.mp4 -i subtitle.srt -c copy -c:s mov_text video_with_subtitle.mp4
```

### Simple disposition
We can also use the new [**disposition**][ffmpeg disposition] flag. We can change this from `default` to `forced`, if 
that helps.
```
ffmpeg -i video.mp4 -i subtitle.srt -c copy -disposition:s:0 default video_with_subtitle.mp4
```

### Disposition
This is the command that I thought stopped it playing by default:
```
fmpeg -i video.mp4 -i subtitle.srt -c:v copy -c:a copy -c:s mov_text -metadata:s:s:0 language=eng -disposition:s:0 default video_with_subtitle.mp4
```

<br>
# Using youtube-dl

One of the main ways that I like to save videos is by using youtube-dl. This has a few options for subtitles:
### List subtitles
```
youtube-dl --list-subs URL
```
### Embed one (or more) subtitles
```
youtube-dl --sub-lang LANGS --embed-subs URL
```
### Embed all subtitles
```
youtube-dl --all-subs --embed-subs URL
```
### Embed auto subtitles
For YouTube, but may work with other video sites too
```
youtube-dl --write-auto-sub --embed-subs URL
```
### Saving the subtitles as a separate file
```
youtube-dl --write-sub --sub-lang LANGS URL
```
### Downloading the subtitles in different formats.
e.g., BBC iPlayer only uses ttml, which ffmpeg can't read. Options are srt, ass, vtt, or lrc.
```
youtube-dl --convert-subtitles srt --embed-subs URL
```
### Download a subtitle only
e.g., Not downloading the video, only the subtitle(s).
```
youtube-dl --write-sub --sub-lang LANGS --skip-download URL
```

The complete list of commands can be found on their [**README**][youtube-dl] page.

<br>
## Netflix and Amazon Prime Video
When downloading from Netflix or Amazon Prime Video, the best tool I've come across is [**AnyStream**][AnyStream]. 
This is made by RedFox - the same people that make [**CloneCD**][CloneCD] and [**CloneDVD**][CloneDVD] (in case you've 
come across these in the past). The trial period is very generous too:

> <font size="5"> <b>
The free 21-day trial version of AnyStream is limited to approximately 10 downloads.</b></font> <font size="5"> You 
have a quota of 10 downloads. Whenever some of it is used up, it will refill at a rate of 1 download every day. This 
amounts to a maximum of 31 downloads over the trial period of 21 days.</font>

The best VPN I've found that actually works with these services to get content from other countries 
is [**ExpressVPN**][ExpressVPN]. This has a 30 day moneyback guarantee in case you're not able to stream from another 
location, which you can initiate by contacting their helpful support staff.

AnyStream can be used to download subtitles too. 
If the subtitles are in a different language character set (e.g., Japanese), then the subtitles will be in a format 
called VobSub (A .sub and a .idx file, .sub being the picture, and .idx containing info on size, colour, position and 
timing). See [**this**][subtitle formats] for more information. 
This is a graphical representation of the characters, and not text itself. You can confirm which subtitle format your 
video is using with ffmpeg:
```
ffmpeg -i video.mp4
```
Srt/mov_text:
```
Stream #0:2(eng): Subtitle: mov_text (tx3g / 0x67337874), 0 kb/s (default)
Metadata:
 handler_name    : SubtitleHandler
```

Vobsub/dvd_subtitle:
```
Stream #0:2(jpn): Subtitle: dvd_subtitle (mp4s / 0x7334706D), 1920x1080, 10 kb/s (default)
Metadata:
 creation_time   : 2021-06-19T00:22:31.000000Z
 handler_name    : 日本語
```

<br>
# Extracting subtitles
The simplest way of extracting subtitles is to identify which stream they're in (using the code above). If it's text, 
then you can extract the subtitles by running:
```
ffmpeg -i video_with_subtitle.mp4 -map 0:s:0 subtitle_extracted.srt
```
Change the stream as needed if there are multiple subtitles. See [**here**][extract multiple subtitles] for some 
examples.

The subtitles may also be in different formats, especially those in Japanese/Chinese. See [**this**][netflix chinese] 
page for more.

If they're in the dvd_stream format (VobSub). then we'll need to use different software to extract them. The best 
option I've found is using [**YAMB**][YAMB] and [**this guide**][subtitle guide].

Then to convert these from VobSub to Srt, you'll want a tool called [**Subtitle Edit**][subtitle edit], which does OCR 
recognition. For non-Latin, select the **Tesseract 5.00 Alpha** OCR method.

Then you can run this new srt file though a translation program. Results will vary greatly, and getting subtitles 
elsewhere is by far the better option, but for obscure shows that are only in a foreign language, then 
this may be your best bet.

[MKVToolNix]: https://mkvtoolnix.download/
[MKV guide]: https://gist.github.com/pavelbinar/20a3366b54f41e355d2745c89091ec46

[subtitle foreground]: https://amiaopensource.github.io/ffmprovisr/index.html#embed_subtitles
[ffmpeg disposition]: https://ffmpeg.org/ffmpeg.html#Main-options

[youtube-dl]: https://github.com/ytdl-org/youtube-dl/blob/master/README.md#options
[AnyStream]: https://www.redfox.bz/en/anystream.html
[CloneCD]: https://www.redfox.bz/en/clonecd.html
[CloneDVD]: https://www.redfox.bz/en/clonedvd.html
[ExpressVPN]: https://www.expressvpn.com
[YAMB]: http://yamb.unite-video.com/features.html

[extract multiple subtitles]: https://sinestesia.co/blog/tutorials/extracting-subtitles-with-ffmpeg
[netflix chinese]: https://forum.redfox.bz/threads/chinese-sub-couldnt-store-as-srt-file.81308/#post-542280

[subtitle formats]: https://www.afterdawn.com/guides/archive/subtitle_formats_explained.cfm
[subtitle guide]: https://forum.videohelp.com/threads/377989-Problems-extracting-subtitle-from-MP4-files#post2440660
[subtitle edit]: https://www.videohelp.com/software/Subtitle-Edit
