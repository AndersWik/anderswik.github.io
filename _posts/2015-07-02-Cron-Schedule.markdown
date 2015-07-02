---
layout: post
title:  Cheat sheet for Crontab
date:   2015-07-02 22:30:00
categories: Crontab
---

 {% highlight raw %}
 Minute (0 - 59)
  |  Hour (0 - 23)
  |  |  Day of month (1 - 31)
  |  |  |  Month (1 - 12)
  |  |  |  |  Day of week (0 - 6)
  |  |  |  |  |
  *  *  *  *  *
 {% endhighlight %}

English abbreviation can be used instead of numbers:

0 = Sun,
1 = Mon,
2 = Tue,
3 = Wed,
4 = Thu,
5 = Fri,
6 = Sat,
7 = Sun,
