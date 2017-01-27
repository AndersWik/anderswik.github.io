---
layout: post
title:  Print Any Email
date:   2017-01-27 20:30:00
categories: Magento
---

To print transactional emails in Magento without sending them. We print the template in [Mage_Core_Model_Email_Template::send()][Mage_Core_Model_Email_Template::send()]. The `function` is located in the file, `/app/code/core/Mage/Core/Model/Email/Template.php` .

{% highlight php %}
<?php
if ($this->isPlain()) {
  $mail->setBodyText($text);
} else {
  $mail->setBodyHTML($text);
}

// Add These Rows
echo $text;
exit;
{% endhighlight %}

This is taken from the following Stack Overflow question: [http://stackoverflow.com/questions/17545272/magento-print-transcational-emali-before-mail-send][http://stackoverflow.com/questions/17545272/magento-print-transcational-emali-before-mail-send]





[http://stackoverflow.com/questions/17545272/magento-print-transcational-emali-before-mail-send]:http://stackoverflow.com/questions/17545272/magento-print-transcational-emali-before-mail-send

[Mage_Core_Model_Email_Template::send()]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Email/Template.php#L447
