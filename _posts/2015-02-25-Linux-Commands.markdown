---
layout: post
title:  OSX/Linux Ubuntu/Mint Basic Commands
date:   2015-02-25 22:30:00
updated:   2016-07-18 22:30:00
categories: Linux OSX
---


Basic Commands
-------------

### echo

[$Manualpage: echo][echo]

{% highlight bash %}
$echo {1,2,3,4,5}
1 2 3 4 5
{% endhighlight %}

{% highlight bash %}
$echo {1..5}
1 2 3 4 5
{% endhighlight %}

{% highlight bash %}
$echo {A..Z}
A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
{% endhighlight %}

{% highlight bash %}
$echo {A..Z}
Z Y X W V U T S R Q P O N M L K J I H G F E D C B A
{% endhighlight %}

### pwd (Print Writen Directory)

[$Manualpage: echo][pwd]

### cd (Change Directory)

[$Manualpage: cp][cp]

absolute path
relative path
cd..

### ls (List)

[$Manualpage: ls][ls]

What type of file
-------------

### file

[$Manualpage: file][file]


Creating a file
-------------

### touch

[$Manualpage: touch][touch]


Reading and Manipulating a file
-------------

### less (Less opposite of more)

[$Manualpage: less][less]

### nano

[$Manualpage: nano][nano]

### vim

[$Manualpage: vim][vim]

### gedit

[$Manualpage: gedit][gedit]

### cat (Concatenate)

[$Manualpage: cat][cat]

{% highlight bash %}
$cat file.txt > otherfile.txt
{% endhighlight %}

{% highlight bash %}
$cat file.txt >> otherfile.txt
{% endhighlight %}

{% highlight bash %}
$cat < file.txt
{% endhighlight %}

{% highlight bash %}
$cat file.txt | wc
{% endhighlight %}

### cp (Copy)

[$Manualpage: cp][cp]

### mv (Move)

[$Manualpage: mv][mv]

### rm (Remove)

[$Manualpage: rm][rm]

### mkdir (Make directory)

[$Manualpage: mkdir][mkdir]

### head

[$Manualpage: head][head]

### tail

[$Manualpage: tail][tail]

To get the last lines of a file we can use `tail`.

{% highlight bash %}
$tail file.txt
{% endhighlight %}

The above command will get the last 10 rows of the file.

{% highlight bash %}
$tail -n 1000 file.txt
{% endhighlight %}

With the option `-n` we can define how many rows we want to get.

{% highlight bash %}
$tail -f file.txt
{% endhighlight %}

With the option `-f` we print all new rows that are added to the file. This
is useful when you monitor a exception file in real time.


Searching
-------------

### find

[$Manualpage: find][find]

### grep

[$Manualpage: grep][grep]

With grep we can search in any given file for a string. Navigate to the file with the terminal. Type `grep "text" file-name` too search in the file.

{% highlight bash %}
grep "text" file-name
{% endhighlight %}

To search in multiple files add more file names.

{% highlight bash %}
grep "text" file1 file3 file3
{% endhighlight %}

To search in a directory type the `-R` and the folder name instead of the filename.

{% highlight bash %}
grep -R "text" folder-name
{% endhighlight %}

For a folder that would be,

{% highlight bash %}
grep -R --color "text" folder-name
{% endhighlight %}

To highlight the search result add `--color` after `grep`.

{% highlight bash %}
grep --color "text" file-name
{% endhighlight %}

To include lines `after` use `-A`.

{% highlight bash %}
grep --color -A 3 "text" file-name
{% endhighlight %}

To include lines `before` use `-B`.

{% highlight bash %}
grep --color -B 3 "text" file-name
{% endhighlight %}

To include lines `before` and `after` use `-A` and `-B`.

{% highlight bash %}
grep --color -A 3 -B 3 "text" file-name
{% endhighlight %}

Or use `-C` to include lines `before` and `after`.

{% highlight bash %}
grep --color -C 3 "text" file-name
{% endhighlight %}


Locating Commands
-------------

### type

### which

[$Manualpage: which][which]

### help

### man (Manual page)

[$Manualpage: man][man]

To get information about any command type `man` and the command in the terminal. Example type `man man` in the terminal. To exit type `q` next to the `:`.

### whatis

[$Manualpage: whatis][whatis]

### whereis

[$Manualpage: whereis][whereis]

Compression
-------------

###zip

[$Manualpage: zip][zip]

### cat

[$Manualpage: zcat][zcat]

### zdiff

[$Manualpage: zdiff][zdiff]

### zgrep

[$Manualpage: zgrep][zgrep]

### zless

[$Manualpage: zless][zless]



I/O redirection
-------------

{% highlight bash %}
$cat file.txt > otherfile.txt
{% endhighlight %}

{% highlight bash %}
$cat file.txt >> otherfile.txt
{% endhighlight %}

{% highlight bash %}
$cat < file.txt
{% endhighlight %}

{% highlight bash %}
$cat file.txt | wc
{% endhighlight %}

Pipes
-------------



Filters
-------------

### sort

[$Manualpage: sort][sort]

### uniq

[$Manualpage: uniq][uniq]

### fmt

[$Manualpage: fmt][fmt]

### pr

[$Manualpage: pr][pr]

### tr

[$Manualpage: tr][tr]

### sed

[$Manualpage: sed][sed]

### awk

[$Manualpage: awk][awk]


Jobs
-------------

### ps

[$Manualpage: ps][ps]

### kill

[$Manualpage: kill][kill]

### jobs

### bg

### fg


Date and Time
-------------

### cal

[$Manualpage: cal][cal]

{% highlight bash %}
$cal

     Juni 2016
Sö Må Ti On To Fr Lö
          1  2  3  4
 5  6  7  8  9 10 11
12 13 14 15 16 17 18
19 20 21 22 23 24 25
26 27 28 29 30
{% endhighlight %}

{% highlight bash %}
$cal -m apr

     Juni 2016
Sö Må Ti On To Fr Lö
          1  2  3  4
 5  6  7  8  9 10 11
12 13 14 15 16 17 18
19 20 21 22 23 24 25
26 27 28 29 30
{% endhighlight %}

jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec


{% highlight bash %}
$ncal

Må     6 13 20 27
Ti     7 14 21 28
On  1  8 15 22 29
To  2  9 16 23 30
Fr  3 10 17 24
Lö  4 11 18 25
Sö  5 12 19 26
{% endhighlight %}

### ncal

[$Manualpage: ncal][ncal]

### date

[$Manualpage: date][date]

### time

[$Manualpage: time][time]





[awk]:http://www.anderswik.se/man/awk.html
[cal]:http://www.anderswik.se/man/cal.html
[cat]:http://www.anderswik.se/man/cat.html
[cp]:http://www.anderswik.se/man/cp.html
[date]:http://www.anderswik.se/man/date.html
[echo]:http://www.anderswik.se/man/echo.html
[find]:http://www.anderswik.se/man/find.html
[file]:http://www.anderswik.se/man/file.html
[fmt]:http://www.anderswik.se/man/fmt.html
[gedit]:http://www.anderswik.se/man/gedit.html
[head]:http://www.anderswik.se/man/head.html
[grep]:http://www.anderswik.se/man/grep.html
[kill]:http://www.anderswik.se/man/kill.html
[less]:http://www.anderswik.se/man/less.html
[ls]:http://www.anderswik.se/man/ls.html
[man]:http://www.anderswik.se/man/man.html
[mkdir]:http://www.anderswik.se/man/mkdir.html
[mv]:http://www.anderswik.se/man/mv.html
[ncal]:http://www.anderswik.se/man/ncal.html
[nano]:http://www.anderswik.se/man/nano.html
[pr]:http://www.anderswik.se/man/pr.html
[ps]:http://www.anderswik.se/man/ps.html
[pwd]:http://www.anderswik.se/man/pwd.html
[rm]:http://www.anderswik.se/man/rm.html
[sed]:http://www.anderswik.se/man/sed.html
[sort]:http://www.anderswik.se/man/sort.html
[tail]:http://www.anderswik.se/man/tail.html
[time]:http://www.anderswik.se/man/time.html
[touch]:http://www.anderswik.se/man/touch.html
[tr]:http://www.anderswik.se/man/tr.html
[uniq]:http://www.anderswik.se/man/uniq.html
[vim]:http://www.anderswik.se/man/vim.html
[whatis]:http://www.anderswik.se/man/whatis.html
[whereis]:http://www.anderswik.se/man/whereis.html
[which]:http://www.anderswik.se/man/which.html
[zcat]:http://www.anderswik.se/man/zcat.html
[zdiff]:http://www.anderswik.se/man/zdiff.html
[zgrep]:http://www.anderswik.se/man/zgrep.html
[zip]:http://www.anderswik.se/man/zip.html
[zless]:http://www.anderswik.se/man/zless.html
