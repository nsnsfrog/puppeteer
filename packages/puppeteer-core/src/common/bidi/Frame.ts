/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Frame as BaseFrame} from '../../api/Frame.js';
import {PuppeteerLifeCycleEvent} from '../LifecycleWatcher.js';
import {EvaluateFunc, HandleFor} from '../types.js';

import {BrowsingContext} from './BrowsingContext.js';
import {HTTPResponse} from './HTTPResponse.js';
import {Page} from './Page.js';

/**
 * Puppeteer's Frame class could be viewed as a BiDi BrowsingContext implementation
 * @internal
 */
export class Frame extends BaseFrame {
  #page: Page;
  #context: BrowsingContext;
  override _id: string;

  constructor(page: Page, context: BrowsingContext, parentId?: string | null) {
    super();
    this.#page = page;
    this.#context = context;
    this._id = this.#context.id;
    this._parentId = parentId ?? undefined;
  }

  override page(): Page {
    return this.#page;
  }

  override name(): string {
    return this._name || '';
  }

  override url(): string {
    return this.#context.url;
  }

  override parentFrame(): Frame | null {
    return this.#page.frame(this._parentId ?? '');
  }

  override childFrames(): Frame[] {
    return this.#page.childFrames(this.#context.id);
  }

  override async evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>> {
    return this.#context.evaluateHandle(pageFunction, ...args);
  }

  override async evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>> {
    return this.#context.evaluate(pageFunction, ...args);
  }

  override async goto(
    url: string,
    options?:
      | {
          referer?: string | undefined;
          referrerPolicy?: string | undefined;
          timeout?: number | undefined;
          waitUntil?:
            | PuppeteerLifeCycleEvent
            | PuppeteerLifeCycleEvent[]
            | undefined;
        }
      | undefined
  ): Promise<HTTPResponse | null> {
    const navigationId = await this.#context.goto(url, options);
    return this.#page.getNavigationResponse(navigationId);
  }

  override setContent(
    html: string,
    options: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }
  ): Promise<void> {
    return this.#context.setContent(html, options);
  }

  override content(): Promise<string> {
    return this.#context.content();
  }

  context(): BrowsingContext {
    return this.#context;
  }

  dispose(): void {
    this.#context.dispose();
  }
}
