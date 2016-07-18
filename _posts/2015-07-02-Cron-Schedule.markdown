---
layout: post
title:  OSX/Linux Ubuntu/Mint Cron
date:   2015-07-02 22:30:00
updated:   2015-07-18 22:30:00
categories: Crontab
---

To add a cron in any Unix environment we can type `crontab -e`.

{% highlight bash %}
crontab -e
{% endhighlight %}

In the crontab we type a cron expression and the path to the file. An example
would be `* * * * * /home/user/somefile.sh`. An asterisk indicates "all", all minutes,
all hours, etc..

 {% highlight raw %}
 Minute (0 - 59)
  |  Hour (0 - 23)
  |  |  Day of month (1 - 31)
  |  |  |  Month (1 - 12)
  |  |  |  |  Day of week (0 - 6)
  |  |  |  |  |
  *  *  *  *  *
 {% endhighlight %}

 We execute the script in intervals. If one is Monday and five is Friday we can
 execute the script on weekdays using `1-5`. The full comman would be `* * * * 1-5 /home/user/somefile.sh`

If you want to temporarily stop the cron use `#` to comment the line out.

 {% highlight bash %}
 #5 0 * * * some/path/to/file.php
 {% endhighlight %}

For the last position english abbreviation can be used instead of numbers.

* 0 = Sun,
* 1 = Mon,
* 2 = Tue,
* 3 = Wed,
* 4 = Thu,
* 5 = Fri,
* 6 = Sat,
* 7 = Sun,

To execute the comman in intervals we can also add the script to the following crons.

* /etc/cron.daily/
* /etc/cron.hourly/
* /etc/cron.monthly/
* /etc/cron.weekly/
