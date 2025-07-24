---
title: Reverse Engineering Ghost Toolbox
description: My first attempt at trying to reverse engineer a program
date: 2025-07-09T20:41:39.309Z
tags:
    - post
layout: "layout/post.html"
comments: true
---

{% quote %}
I will not be surprised if any of what I talk about in this post gets changed, I just thought it was cool.
{% endquote %}

It all started with me wanting to figure out what kind of tool a custom Windows ISO was using to download stuff like FireFox or Chrome. I wanted to see if I could make my own version of it.

I tried looking for some python tool that I remember from one of them, but I couldn't find it. So I decided to install the OS that I knew had something like that and oh wow did that ever send me down a rabbit hole.

----

## Ghost Spectre
I decided to install the OS that I knew had a tool, as I mentioned above. It took me a while to actually even download the ISO, which was its own mess that I don't want to go through again, nor will I discuss how to download it as this is not what this post is for.

I installed Ghost Spectre into a VM using VMWare, which gives me a safe space to mess around with.

{% quotewarning %}
I want to point out that installing a custom Windows ISO can put you at risk to getting malware. <b>DO NOT</b> install custom Windows ISOs unless you either know what you are doing, or know what you are going to get into.
{% endquotewarning %}

Once I Ghost Spectre (which I will just be calling "Ghost" from here on out), I quickly located where the tool's EXE was located, the tool being called "Ghost Toolbox", which I will just call "Toolbox".
I ended up finding the toolbox in `C:\Ghost Toolbox\` and there were 2 files, and a folder. One file was the actual EXE called `toolbox.updater.x64.exe`, a config called `toolbox.updater.x64.config`, and the folder was called `wget`.

<img alt="A screenshot of the Windows File Explorer, showing 3 items listed. In order, they are: 'wget', 'toolbox.updater.x64.config' and 'toolbox.updater.x64.exe'" src="/asset/img/post-assets/rev-eng-ghost/toolboxLocated.png">

When I run the program, I see a CLI application open, followed by PowerShell and <abbr title="Command Prompt">CMD</abbr> open, which contains the actual toolbox.

<img alt="A screenshot of Ghost Toolbox's Main Menu" src="/asset/img/post-assets/rev-eng-ghost/toolboxMenu.png">

----

## Looking in the Program

I thought, since it is just running the Command Prompt, that it has to be a batch script running somewhere. I downloaded Sysinternals [Process Monitor (Procmon)](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) and [Process Explorer](https://learn.microsoft.com/en-us/sysinternals/downloads/process-explorer) to explore what exactly the program was doing. As I watched, I noticed in Procmon that the toolbox EXE kept executing CMD, which tells me that it is indeed just running a script file (often called a Batch file) somewhere on the system.

At that point, I opened Process Explorer, which is pretty much Task Manager but on steroids. Once I opened it, I closed the toolbox and re-ran it. As it was executing, I froze Process Explorer, making it so it doesn't update, and I was right, it was indeed running a CMD window... and I could see one of many arguments that most likely were running. It is at this point, I downloaded another Sysinternals tool called [Strings](https://learn.microsoft.com/en-us/sysinternals/downloads/strings), which pretty much allows me to view all the strings in a program (who would have guessed). I ran it on the program and got a lot of garbage, but as the output was going by, I noticed a few long strings that looked interesting, so I redirected the output of strings to a text file, and after filtering out all the garbage, I found what I was looking for, a set of command line instructions.

The string of code I found was the following:

```
%COMSPEC% /c del /q /f wget\update >nul 2>nul
%COMSPEC% /c del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd >nul 2>nul
%COMSPEC% /c wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update >nul 2>nul
%COMSPEC% /c timeout /t 1 >nul 2>nul
%COMSPEC% /c wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests >nul 2>nul
%COMSPEC% /c del /a /q /f %Windir%\System32\wbem\en-US\update.cmd >nul 2>nul
%COMSPEC% /c timeout /t 1 >nul 2>nul
%COMSPEC% /c rename %Windir%\System32\migwiz\dlmanifests\toolbox.cmd run.ghost.cmd >nul 2>nul
%COMSPEC% /c attrib +S +H +R %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd >nul 2>nul
%COMSPEC% /c %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd >nul 2>nul
%COMSPEC% /c del /q /f wget\update >nul 2>nul
```

Okay... thats a lot, let's take a little bit to break that down... `%COMSPEC%` is a variable in the command prompt built into Windows, which just points to where CMD is and `/c` just tells it to execute a command before closing. So I am just going to ignore that. And you may have noticed at the end of all commands the text `>nul 2>nul`, which tells the command prompt to not tell you what is going on, making programs that are otherwise "loud" silent, not putting out an output. So now that we know that, the commands look more like this:

```
del /q /f wget\update 
del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update 
timeout /t 1 
wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests 
del /a /q /f %Windir%\System32\wbem\en-US\update.cmd 
timeout /t 1 
rename %Windir%\System32\migwiz\dlmanifests\toolbox.cmd run.ghost.cmd 
attrib +S +H +R %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
%Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
del /q /f wget\update 
```

Another thing we should filter out is the commands that are called `timeout`, which simply just tell the command prompt to wait a specific amount of time before running the rest of the script, removing those we get:

```
del /q /f wget\update 
del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update 
wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests 
del /a /q /f %Windir%\System32\wbem\en-US\update.cmd 
rename %Windir%\System32\migwiz\dlmanifests\toolbox.cmd run.ghost.cmd 
attrib +S +H +R %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
%Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
del /q /f wget\update 
```

----

## Breaking it down

Let's start to break this down line by line and bit by bit, starting with `del /q /f wget\update`.

`del` is a command short for Delete in Windows, so it is safe to assume that we are going to delete a file. `/q` makes it so it doesn't put an output into the prompt, which in this case, would just be hiding "The operation has completed." or something similar. `/f` means to forcfully delete something, no matter what. Finally, `wget\update` is a path, where `wget\` is a folder and `update` is a file. So the command is telling Windows to delete a file called `update` in the folder `wget`... Interesting.

The next line (`del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd`) does something similar, only changing out the path for `%Windir%\System32\migwiz\dlmanifests\run.ghost.cmd` instead of `wget\update`. Interesting, that tells me that the file we are running is stored in the folder called `C:\Windows\System32\migwiz\dlmanifests\`, as `%windir%` is another system variable that points to `C:\Windows\`... But when I try visiting the folder, I don't see a file named `run.ghost.cmd`, which is a batch file... Strange, let's keep breaking this down...

The next line (`wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update`) is interesting, as we are running a program called `wget`, which is a simple program to download files from the internet. We see a similar argument to hide the output as before called `-q`, so removing that will show us the output should we run `wget` on it's own. We will be ignoring the backups part as it isn't relevent here. Next we see a URL, which makes sense since we are pulling a file from the internet... when I tried visiting it the first time, I thought it would have blocked me because I am not downloading it from the toolbox itself... but no! It actually downloads the file in my browser. I was really interested in this file... but let's keep breaking down this command. `-t 0` tells `wget` to just keep retrying infinitely should it fail. Finally, `-O wget\update` tells `wget` to store the file in the `wget` folder, and call the file `update`. Let's keep looking and see what it does next...

The next command it runs is `wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests`. The start of it, `wget\7z1900-extra\x64\7za` is telling us that the program is now running a archive program called `7za`, which is part of [7-Zip](https://7-zip.org/). The next part is an argument called `x`, which is short for extract in `7za`. So we are going to be extracting something... interesting. The next part is `wget\update`, which is the file that `wget` just saved. Really interesting! That tells us that the file we just downloaded is actually just an archive! And opening it with 7-zip does indeed confirm that, with a file inside if it simply called `toolbox.cmd`!

<img alt="A screenshot of 7-zip, showing the contents of the 'update' file mentioned above" src="/asset/img/post-assets/rev-eng-ghost/7zip.png">

But when I tried extracting it, it requires a password... dang... Let's keep digging at that command for more clues then... The next part of the command is `-aoa`, which tells `7za` to overwrite all files, without prompting for any user input... in this case, it is kind of useless as we deleted the files before. The next argument is `-pghostX2021`... That looks strange... but checking the arguments for 7za, `-p` is short for password, meaning if we remove the `-p` at the start, we are left with `ghostX2021`, and when I try extracting the archive now, with that password, it works! But before we get too excited, let's keep looking at the last part of the command... `-o%Windir%\System32\migwiz\dlmanifests`, oh look at that! It extracts out the file to the folder we deleted `run.ghost.cmd` from! But that doesn't answer why it is called something different right now...

But before we finish up with the rest of it, here is all the commands we have gone though so far:

```
del /q /f wget\update 
del /a /q /f %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
wget\wget.exe -q --backups=1 http://xcazy.the-ninja.jp/update/2021/x64/toolbox.update -t 0 -O wget\update 
wget\7z1900-extra\x64\7za x wget\update -aoa -pghostX2021 -o%Windir%\System32\migwiz\dlmanifests 
```

That's a lot! And mostly all we needed to get the actual script I wanted to see, the rest of the commands,

```
del /a /q /f %Windir%\System32\wbem\en-US\update.cmd 
rename %Windir%\System32\migwiz\dlmanifests\toolbox.cmd run.ghost.cmd 
attrib +S +H +R %Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
%Windir%\System32\migwiz\dlmanifests\run.ghost.cmd 
del /q /f wget\update 
```

go through the process of renaming the file (`toolbox.cmd`) to `run.ghost.cmd` and making it so the file is hidden, meaning we cannot see it unless we tell windows we want to see hidden files, then running the file.
And before all that, it tried to delete a file that doesn't exist so I have no idea what's going on there... and then once the program starts running, it deletes the `wget\update` archive.

----

## Success!

We now have the file I wanted to get, `toolbox.cmd`! And now I can look at what it is trying to do! We have figured out where the file is downloaded from, figured out that it is a password protected archive, found the password hidden in plain text in the program itself, and have successfully extracted it from the archive using the password!

This was a fun little side project I did, and it actually was my first time doing any serious reverse engineering, so I learned some things doing this!

I hope you enjoyed this as much as I did! Feel free to discuss everything in the comments below, I would love to see what you would have done differently or would have tried!
