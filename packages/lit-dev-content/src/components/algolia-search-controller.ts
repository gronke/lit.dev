/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Task, TaskStatus} from '@lit-labs/task';
import type {Hit} from '@algolia/client-search';
export type {Hit} from '@algolia/client-search';
import algoliasearch, {
  SearchClient,
  SearchIndex,
} from 'algoliasearch/dist/algoliasearch-lite.esm.browser.js';
import {ReactiveControllerHost} from 'lit';
import {publicVars} from 'lit-dev-tools-esm/lib/configs.js';

const agloliaSearchControllerDefaultOptions = {
  appId: publicVars.algolia.appId,
  searchOnlyKey: publicVars.algolia.searchOnlyKey,
  index: publicVars.algolia.index,
};

export type AlgoliaSearchControllerOptions =
  typeof agloliaSearchControllerDefaultOptions;

export class AgloliaSearchController<T extends {}> {
  private _task;
  private _client: SearchClient;
  private _index: SearchIndex;
  private _lastValue: Hit<T>[] = [];

  public get value() {
    if (this._task.status !== TaskStatus.COMPLETE) {
      return this._lastValue;
    }

    this._lastValue = this._task.value!;
    return this._task.value!;
  }

  constructor(
    host: ReactiveControllerHost,
    argsFn: () => string,
    options?: Partial<AlgoliaSearchControllerOptions>
  ) {
    const opts = {...agloliaSearchControllerDefaultOptions, ...options};
    this._client = algoliasearch(opts.appId, opts.searchOnlyKey);
    this._index = this._client.initIndex(opts.index);
    this._task = new Task(
      host,
      ([text]) => this._querySearch(text),
      () => [argsFn()]
    );
  }

  /**
   * Populate suggestion dropdown from query.
   *
   * An empty query clears suggestions.
   */
  private async _querySearch(query: string): Promise<Hit<T>[]> {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return [];
    }
    const results = await this._index.search<T>(trimmedQuery, {
      page: 0,
      hitsPerPage: 10,
    });
    return results.hits;
  }
}