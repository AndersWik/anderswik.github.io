---
layout: post
title:  Magento Add To Sitemap.
date:   2015-02-28 22:30:00
categories: Magento
---

Sometimes we make modules that creates some additional content in our Magento store. The problem is how do we add this content to the `Google Site.map`. We can add an observer to our module and add our content from there. [Download][sitemapaddition] the finished module or add the code from below.

In our `config.xml`

{% highlight xml %}
<global>
  <events>
    <sitemap_sitemap_save_before>
      <observers>
        <sitemapaddition>
          <type>singleton</type>
          <class>sitemapaddition/observer</class>
          <method>addToSitemapObserver</method>
        </sitemapaddition>
      </observers>
    </sitemap_sitemap_save_before>
  </events>
  <models>
    <sitemapaddition>
      <class>Wik_Sitemapaddition_Model</class>
    </sitemapaddition>
    <sitemap>
      <rewrite>
        <sitemap>Wik_Sitemapaddition_Model_Sitemap_Sitemap</sitemap>
      </rewrite>
    </sitemap>
  </models>
</global>
{% endhighlight %}



In our `Model/Observer.php`

{% highlight php %}

<?php
class Wik_Sitemapaddition_Model_Observer
{
  public function addToSitemapObserver(Varien_Event_Observer $observer)
	{
		$sitemap = $observer->getEvent()->getSitemap();
		$sitemapFilename = Mage::getBaseDir() . '/' . ltrim($sitemap->getSitemapPath() . $sitemap->getSitemapFilename(), '/' . DS);
		if (!file_exists($sitemapFilename)) {
			return $this;
		}
		$xml = trim(file_get_contents($sitemapFilename));
		$xml = substr($xml, 0, -strlen('</urlset>'));
    $xml .= '<url><loc>'.Mage::getBaseUrl(Mage_Core_Model_Store::URL_TYPE_WEB).'sitemapaddition/'.'</loc><lastmod>'.Mage::getSingleton('core/date')->gmtDate('Y-m-d').'</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>';
		$xml .= '</urlset>';
		@file_put_contents($sitemapFilename, $xml);
		return $this;
	}
}

{% endhighlight %}



In our `Model/Sitemap/Sitemap.php`

{% highlight php %}
<?php
class Wik_Sitemapaddition_Model_Sitemap_Sitemap extends Mage_Sitemap_Model_Sitemap
{
	/**
	 * Event data
	 *
	 * @var string
	*/
	protected $_eventPrefix = 'sitemap_sitemap';
	protected $_eventObject = 'sitemap';
}
{% endhighlight %}




[sitemapaddition]:https://github.com/AndersWik/Magento_Wik_Sitemapaddition
