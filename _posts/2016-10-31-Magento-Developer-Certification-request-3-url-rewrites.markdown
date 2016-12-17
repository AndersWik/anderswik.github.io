---
layout: post
title:  Magento Developer Certification Request Flow and Url Rewrites
date:   2016-10-31 18:00:00
categories: Magento
---

Notes about `Magento Developer Certification the Request Flow and Url Rewrites`.

2 - Request Flow
====================

Url Rewrites
--------------------

### Describe URL structure/processing in Magento

In Magento we can use url rewrites to define a `request_path`. This `request_path` will in Magento be resolved to a `target_path`. This allows us to have SEO/human friendly urls that Magento translates to a controller and action.

Magentos url structure is `[baseurl]/index.php/[frontname]/[controller]/[action]`. If `Apache’s` `mod_rewrite` module are enabled the `index.php` part of the url can be excluded (`[baseurl]/[frontname]/[controller]/[action]`).

{% highlight html %}
############################################
## always send 404 on missing files in these folders

    RewriteCond %{REQUEST_URI} !^/(media|skin|js)/

############################################
## never rewrite for existing files, directories and links

    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-l

############################################
## rewrite everything else to index.php

    RewriteRule .* index.php [L]
{% endhighlight %}

### Describe the URL rewrite process

#### Focus on the internals of database-based URL rewrites.

#### What is the purpose of each of the fields in the core_url_rewrite table?

* `url_rewrite_id`
  Unique id for the Url rewrite in the table.
* `store_id`
  This is the id of the store that the redirect applies to.
* `id_path`
  The id path will start with category or product followed by the id. A Category with the category id 13 would be "category/13". A Product with the product id 13 would be "product/13"

  If the product exist in more than one category the category id's will be added to the end. If a product with the product id 13 exist in three categories. The categories have the following category ids's 13,14 and 15. Then there would be three rows in core_url_rewrite with the following id_path set.

    * product/13/13
    * product/13/14
    * product/13/15

* `request_path`
  SEO friendly url.
* `target_path`
  Magentos internal url (`[frontname]/[controller]/[action]`).
* `is_system`
  Created automatically by the system. URL rewrites re-indexing may change these rows.
* `options`
  Redirect permanent (RP) / Redirect (R) / `NULL`
* `description`
* `category_id`
  The id of the category.
* `product_id`
  The id of the product.

#### When does Magento created the rewrite records for categories and products?

When a url key is changed on a product or category Magento will create a permanent redirect for the old url key to the new (URL Key Changed must be enabled). Magento uses the urlkey attribute to create a rewrite when the product or category is created. If the urlkey attribute is not set the name of the product/category is used.

[Mage_Catalog_Model_Url][Mage_Catalog_Model_Url]

If the product/category is resaved with a new name a new rewrite is created. The old rewrite will become an permanent redirect (301) to the new url.

#### How and where does Magento find a matching record for the current request?

Magento finds the matching record in the `core_url_rewrite` table.
It looks at the `request_path` to find the `target_path`.

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Core_Controller_Varien_Front::dispatch()][Mage_Core_Controller_Varien_Front::dispatch]
* [Mage_Core_Model_Url_Rewrite::rewrite()][Mage_Core_Model_Url_Rewrite::rewrite]

#### Additional Readings

* [Alan Storm: In Depth Magento Dispatch: Rewrites][alanstorm.dispatch_rewrites]
* [Nathan McBride: Request-flow URL-Rewrite][brideo.url-rewrite]
* [Solving Magento: Magento URL Rewrites][divisionlab.url-rewrites]



[alanstorm.dispatch_rewrites]:http://alanstorm.com/magento_dispatch_rewrites_intro/
[brideo.url-rewrite]:http://brideo.co.uk/magento-certification-notes/request-flow/URL-Rewrite/
[divisionlab.url-rewrites]:http://www.divisionlab.com/solvingmagento/magento-url-rewrites/



[index.php]:https://github.com/AndersWik/Magento-1x/blob/master/index.php
[index.php-Mage::run]:https://github.com/AndersWik/Magento-1x/blob/master/index.php#L83

[Mage]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php
[Mage::app]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L606
[Mage::run]:https://github.com/AndersWik/Magento-1x/blob/master/app/Mage.php#L662

[Mage_Catalog_Model_Url]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Catalog/Model/Url.php

[Mage_Core_Model_App]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php
[Mage_Core_Model_App::init]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L265
[Mage_Core_Model_App::baseinit]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L297

[Mage_Core_Model_App::run]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L345
[Mage_Core_Model_App::run->getFrontController()->dispatch()]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L365

[Mage_Core_Model_App::_initBaseConfig]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L388
[Mage_Core_Model_App::_initModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L422
[Mage_Core_Model_App::_initFrontController]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L759
[Mage_Core_Model_App::getFrontController]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/App.php#L1110

[Mage_Core_Model_Config]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php
[Mage_Core_Model_Config::loadModules]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Config.php

[Mage_Core_Model_Url_Rewrite]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Url/Rewrite.php
[Mage_Core_Model_Url_Rewrite::rewrite]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Model/Url/Rewrite.php#L196

[Mage_Core_Controller_Varien_Front]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Front.php
[Mage_Core_Controller_Varien_Front::addRouter]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Front.php#L90
[Mage_Core_Controller_Varien_Front::init]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Front.php#L126
[Mage_Core_Controller_Varien_Front::dispatch]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Front.php#L156

[Mage_Core_Controller_Varien_Router_Standard]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Router/Standard.php
[Mage_Core_Controller_Varien_Router_Standard::collectRoutes]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Router/Standard.php#L33
[Mage_Core_Controller_Varien_Router_Standard::match]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Core/Controller/Varien/Router/Standard.php#L110
