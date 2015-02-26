---
layout: post
title:  Can’t access the Magento admin?
date:   2015-02-25 22:30:00
categories: Linux
---
Did you lock yourself out? Can't access the Magento admin?
One simple solution is to make a module with an install-script
that adds a new admin user. The next solution is to [download][newadmin] a finished module that do it.

Logg on with ftp/ssh and drag the app folder in to the root of
your installation. Merge the folder do not replace it!

{% highlight bash %}
<?php
$installer = $this;
$installer->startSetup();

$userName = "you";
$firstName = "you";
$lastName = "youagain";
$email = "you@example.com";
$password = "welcome99";

try {
  $user = Mage::getModel("admin/user")
  ->setUsername($userName)
  ->setFirstname($firstName)
  ->setLastname($lastName)
  ->setEmail($email)
  ->setPassword($password)
  ->save();
  $role = Mage::getModel("admin/role");
  $role->setParent_id(1);
  $role->setTree_level(1);
  $role->setRole_type('U');
  $role->setUser_id($user->getId());
  $role->save();
} catch (Exception $ex) {
  Mage::helper('newadmin')->log($ex);
}
{% endhighlight %}




[newadmin]:https://github.com/AndersWik/Magento_Wik_Newadmin
