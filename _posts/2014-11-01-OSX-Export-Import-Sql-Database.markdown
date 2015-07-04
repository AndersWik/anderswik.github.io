---
layout: post
title:  "Export and import a MySQL database with the terminal"
date:   2014-11-01 22:30:00
updated:   2015-07-03 22:30:00
categories: Magento
---

On Linux we can export and import a MySQL database using the command line.

{% highlight bash %}
Export a SQL database
mysqldump -u [USER] -p [DBNAME] > dump.sql

Import a SQL database
mysql -u [USER] -p [DBNAME] < dump.sql
{% endhighlight %}

Examples:
`mysqldump -u root -p mydb1 > dump.sql`
`mysql -u root -p mydb2 < dump.sql`

Using the OSX terminal to export and import a database SQL database.
If you are using MAMP navigate to: `cd /applications/MAMP/library/bin`

{% highlight bash %}
Export a SQL database
./mysqldump -u [USER] -p [DBNAME] > dump.sql

Import a SQL database
./mysql -u [USER] -p [DBNAME] < dump.sql
{% endhighlight %}

Examples:
`./mysqldump -u root -p mydb1 > dump.sql`
`./mysql -u root -p mydb2 < dump.sql`
