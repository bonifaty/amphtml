/**
 * Copyright 2015 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {UrlReplacements} from '../../../src/url-replacements';
import {assertHttpsUrl} from '../../../src/url';
import {childElementByAttr} from '../../../src/dom';
import {isLayoutSizeDefined} from '../../../src/layout';
import {log} from '../../../src/log';
import {templatesFor} from '../../../src/template';
import {xhrFor} from '../../../src/xhr';

/** @const {!Function} */
const assert = AMP.assert;

/** @const {string} */
const TAG = 'AmpList';


/**
 * The implementation of `amp-list` component. See {@link ../amp-list.md} for
 * the spec.
 */
export class AmpList extends AMP.BaseElement {

  /** @override */
  isLayoutSupported(layout) {
    return isLayoutSizeDefined(layout);
  }

  /** @override */
  buildCallback() {
    /** @const {!Element} */
    this.container_ = this.getWin().document.createElement('div');
    this.applyFillContent(this.container_, true);
    this.element.appendChild(this.container_);
    if (!this.element.hasAttribute('role')) {
      this.element.setAttribute('role', 'list');
    }

    /** @private @const {!UrlReplacements} */
    this.urlReplacements_ = new UrlReplacements(this.getWin());

    /** @private {?Element} */
    this.overflowElement_ = childElementByAttr(this.element, 'overflow');
    if (this.overflowElement_) {
      this.overflowElement_.classList.add('-amp-overflow');
      this.overflowElement_.classList.toggle('amp-hidden', true);
    }
  }

  /** @override */
  layoutCallback() {
    const src = this.urlReplacements_.expand(assertHttpsUrl(
        this.element.getAttribute('src'), this.element));
    const opts = {
      credentials: this.element.getAttribute('credentials')
    };
    return xhrFor(this.getWin()).fetchJson(src, opts).then(data => {
      assert(typeof data == 'object' && Array.isArray(data['items']),
          'Response must be {items: []} object %s %s',
          this.element, data);
      const items = data['items'];
      return templatesFor(this.getWin()).findAndRenderTemplateArray(
          this.element, items).then(this.rendered_.bind(this));
    });
  }

  /**
   * @param {!Array<!Element>} elements
   * @private
   */
  rendered_(elements) {
    elements.forEach(element => {
      if (!element.hasAttribute('role')) {
        element.setAttribute('role', 'listitem');
      }
      this.container_.appendChild(element);
    });

    // Change height if needed.
    this.getVsync().measure(() => {
      const scrollHeight = this.container_./*OK*/scrollHeight;
      const height = this.element./*OK*/offsetHeight;
      if (scrollHeight > height) {
        this.requestChangeHeight(scrollHeight, actualHeight => {
          if (this.overflowElement_) {
            this.overflowElement_.classList.toggle('amp-hidden', false);
            this.overflowElement_.onclick = () => {
              this.overflowElement_.classList.toggle('amp-hidden', true);
              this.changeHeight(actualHeight);
            };
          } else {
            log.warn(TAG,
                'Cannot resize element and overlfow is not available',
                this.element);
          }
        });
      }
    });
  }
}

AMP.registerElement('amp-list', AmpList);
