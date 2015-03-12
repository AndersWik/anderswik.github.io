---
layout: post
title:  PHP Methods
date:   2014-12-08 22:30:00
categories: PHP
---

A simple way to get all the class methods available in your object.

{% highlight php %}
<?php
$a = new A();
$class_methods = get_class_methods($a);
foreach($class_methods as $i){
  echo $i;
}
?>
{% endhighlight %}

Some times we want to print a variable.

{% highlight php %}
<?php
$toprint = print_r($somevar, true);
echo toprint;
?>
{% endhighlight %}

Some times we want to print a var_dump to a log file or have the result in variable for some other reason.

{% highlight php %}
<?php
ob_start();
var_dump($stuffInVar);
$result = ob_get_clean();
?>
{% endhighlight %}

Modifying a date plus or minus.

{% highlight php %}
<?php
public function modifyDate1($newDate)
{
  $date = date("Y-m-d");
  return strtotime(date("Y-m-d", strtotime($date)) . $newDate);
}

public function modifyDate2($newDate)
{
  return date('d-m-Y', strtotime($newDate));
}

$this->modifyDate1(" +1 day");
$this->modifyDate1(" -1 day");
$this->modifyDate1(" +1 week");
$this->modifyDate1(" -1 week");
$this->modifyDate1(" +1 month");
$this->modifyDate1(" -1 month");
$this->modifyDate1(" +30 days");
$this->modifyDate1(" -30 days");
?>
{% endhighlight %}
