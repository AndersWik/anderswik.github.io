---
layout: post
title:  PHP Methods
date:   2014-12-07 22:30:00
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

Some times we want to print a var_dump to a log file or have the result in variable for some other reason.

{% highlight php %}
<?php
ob_start();
var_dump($someVar);
$result = ob_get_clean();
?>
{% endhighlight %}
