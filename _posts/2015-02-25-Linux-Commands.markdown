---
layout: post
title:  Linux Quick Start
date:   2015-02-25 22:30:00
updated:   2015-07-01 22:30:00
categories: Linux
---
Some Quick tips on terminal commands that are useful.

User
-------------

* To list all users `cut -d: -f1 /etc/passwd`.

* To add a new user type `sudo useradd your_username`.

* To change user name type `usermod -l your_new_username your_old_username`.

* To change password of a user type `sudo passwd your_username`.

* To delete a user type `sudo userdel your_username`.

* To delete the home directory of a deleted user type `sudo rm -r /home/your_username`.




Manual page
-------------

To get information about any command type `man` and the command in the terminal. Example type `man man` in the terminal. To exit type `q` next to the `:`.

Search in file with grep
-------------

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

To highlight the search result add `--color` after `grep`.

{% highlight bash %}
grep --color "text" file-name
{% endhighlight %}

For a folder that would be,

{% highlight bash %}
grep -R --color "text" folder-name
{% endhighlight %}


Add/Remove Cron
-------------

Type `crontab -e` in the terminal. In the file add the frequency and path to the file you want to run.

{% highlight bash %}
5 0 * * * some/path/to/file.php
{% endhighlight %}

If you want to temporarily stop the cron use `#` to comment the line out.


Execute .sh file
-------------

You have a file (file.sh). In the terminal navigate to the folder where the file is located.

* Type `chmod +x file.sh` to make it executable.
* Then type `sh ./file.sh` to execute it.


{% highlight bash %}
chmod +x file.sh
sh ./file.sh
{% endhighlight %}


Close Frozen Window
-------------

Use the xkill command to close a frozen window. Type `xkill` in the teminal and use the mouse to click on any window. Success it is now closed.

{% highlight bash %}
xkill
{% endhighlight %}


DNS-lookup
-------------
To get an ip with a domain-name use the `host` command.

{% highlight bash %}
host example.com
{% endhighlight %}


WHOIS
-------------

Use the `whois` command to get information about a domain.

{% highlight bash %}
whois example.com
{% endhighlight %}


Domain information groper (dns-lookup utility)
-------------

Use the `dig` command to get information about a domain.

{% highlight bash %}
dig example.com
{% endhighlight %}


Edit you host-file
-------------

This is not a single command but it is still useful.
To redirect a domain locally you can add a row in your `hosts` file. Open the file,

{% highlight bash %}
sudo nano /ect/hosts
{% endhighlight %}

and add a new row.

{% highlight bash %}
0.0.0.0         facebook.com
{% endhighlight %}

Depending on the your browser you should now be loopedbacked when trying to access facebook.com.


[geek]:http://www.howtogeek.com/howto/27350/beginner-geek-how-to-edit-your-hosts-file/
