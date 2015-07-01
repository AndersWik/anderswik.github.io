---
layout: post
title:  PHP Methods
date:   2014-12-08 22:30:00
updated:  2015-07-01 22:30:00
categories: PHP
---

To find out if the object is of a specified class use [is_a()][is-a].

{% highlight php %}
<?php
$obj = new ObjectStuff();
is_a($obj, 'ObjectStuff');
?>
{% endhighlight %}

To find out if a property is available in a class use [property_exists()][property_exists].

{% highlight php %}
<?php
property_exists('aClass', 'aProperty')
?>
{% endhighlight %}

To find out if a method is available in a class use [method_exists()][method-exists].

{% highlight php %}
<?php
$obj = new ObjectStuff();
method_exists($obj, 'ObjectMethod');
?>
{% endhighlight %}

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


[is-a]:http://php.net/manual/en/function.is-a.php
[property_exists]:http://php.net/manual/en/function.property-exists.php
[method-exists]:http://php.net/manual/en/function.method-exists.php
