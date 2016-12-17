---
layout: post
title:  Magento Developer Certification Advanced features and Widgets
date:   2016-12-01 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Advanced and Widgets`.

10 - Advanced features
=====================

Widgets
-------

### Create frontend widgets and describe widget architecture:

* widget.xml
* block that implements [Mage_Widget_Block_Interface][Mage_Widget_Block_Interface]

`app/etc/modules/my_module.xml`

{% highlight xml %}
<?xml version="1.0"?>
<config>
    <modules>
        <My_Module>
            <active>true</active>
            <codePool>community</codePool>
            <depends/>
        </My_Module>
    </modules>
</config>
{% endhighlight %}

`app/code/community/My/Module/etc/config.xml`

{% highlight xml %}
<?xml version="1.0"?>
<config>
 <modules>
  <My_Module>
   <version>0.0.1</version>
  </My_Module>
 </modules>
 <global>
  <blocks>
   <my_module>
    <class>My_Module_Block</class>
   </my_module>
  </blocks>
 </global>
</config>
{% endhighlight %}

`app/code/community/My/Module/etc/widget.xml`

{% highlight xml %}
<widgets>
 <my_module_youtube type="my_module/youtube">
  <name>This is a YouTube Widget</name>
  <description type="desc">
   This Youtube widget displays a video.
  </description>
 </my_module_youtube>
</widgets>
{% endhighlight %}

`app/code/community/My/Module/Block/Youtube.php`

{% highlight php %}
`<?php
class My_Module_Block_Youtube extends Mage_Core_Block_Abstract implements Mage_Widget_Block_Interface
{
 protected function _toHtml ()
 {
  return $this->getVideoId();
 }
}`
{% endhighlight %}

In a CMS page,

{% highlight raw %}
{ { widget type="my_module/youtube" video_id="dQw4w9WgXcQ" } }
{% endhighlight %}

#### What classes are typically involved in Magento widget architecture?

* [Mage_Core_Block_Abstract][Mage_Core_Block_Abstract]
* [Mage_Widget_Block_Interface][Mage_Widget_Block_Interface]

#### How are admin-configurable parameters and their options specified?

`app/code/community/My/Module/etc/widget.xml`

{% highlight xml %}
<widgets>
 <my_module_youtube type="my_module/youtube">
  <name>This is a YouTube Widget</name>
  <description type="desc">
   This Youtube widget displays a video.
  </description>

  <parameters>
   <video_id>
    <required>1</required>
    <visible>1</visible>
    <value>Video ID</value>
    <label>Video ID</label>
    <type>text</type>
   </video_id>
  </parameters>

 </my_module_youtube>
</widgets>
{% endhighlight %}

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Widget_Model_Widget][Mage_Widget_Model_Widget]

#### Additional Readings

* [Alan Storm: No Frills Magento Layout, Chapter 7][alanstorm.no-frills-magento-layout]
* [Magecert: Advanced Features][magecert.advanced]


[alanstorm.no-frills-magento-layout]:http://store.pulsestorm.net/products/no-frills-magento-layout
[magecert.advanced]:http://magecert.com/advanced-features.html


[Mage_Core_Block_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Block/Abstract.php
[Mage_Widget_Block_Interface]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Widget/Block/Interface.php
[Mage_Widget_Model_Widget]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Widget/Model/Widget.php
