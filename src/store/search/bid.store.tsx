import { DateTime } from 'luxon';
import { SyntheticEvent, useCallback } from 'react';
import {
  bidTask,
  searchApi,
  SearchCustomQueryType,
  BidItemType,
  SearchTaskType,
} from '@/apis';
import { KeywordRegExp, StoreInstance } from '@/core';
import { DateFormat, DateChangeEventHandler } from '@/component';
import { appStore } from '../app';
import { keywordStore } from '../keyword';
import { SearchStoreType } from './types';

export class BidSearchStore extends StoreInstance<
  SearchStoreType<SearchTaskType, SearchCustomQueryType, BidItemType>
> {
  useChangeTaskEvent(): (
    text: string,
  ) => (e: SyntheticEvent<Element, Event>, checked: boolean) => void {
    const setState = this.useSetState();

    return useCallback(
      (text) => (_, checked) => {
        const task = bidTask.findByText(text);

        if (!task) {
          return;
        }

        if (!task.endPoint && checked) {
          return setState((prev) => ({
            ...prev,
            tasks: bidTask.initValues,
          }));
        }

        if (task.endPoint && checked) {
          return setState((prev) => ({
            ...prev,
            tasks: [...prev.tasks.filter(({ endPoint }) => endPoint), task],
          }));
        }

        if (task.endPoint && !checked) {
          return setState((prev) => {
            const tasks = prev.tasks.filter(({ text }) => text !== task.text);

            return {
              ...prev,
              tasks: tasks.length ? tasks : bidTask.initValues,
            };
          });
        }
      },
      [setState],
    );
  }

  useSetDateCallback(key: 'inqryBgnDt' | 'inqryEndDt'): DateChangeEventHandler {
    const setState = this.useSetState();

    return useCallback(
      (datetime) => {
        setState((prev) => {
          let value: string | undefined;

          if (!datetime) {
            value = undefined;
          } else {
            value = datetime.toFormat(DateFormat);
          }

          return { ...prev, query: { ...prev.query, [key]: value } };
        });
      },
      [key, setState],
    );
  }

  useSearchCallback(): () => Promise<void> {
    const [{ tasks, query }, setState] = this.useState();

    const setLoading = appStore.useSetLoading();
    const setMessage = appStore.useSetMessage();

    const { include, exclude } = keywordStore.useValue();

    return useCallback(async () => {
      if (!tasks || !query) {
        return setMessage({
          warn: '검색 조건을 다시 확인하세요.',
        });
      }

      let taskTargets: SearchTaskType[];

      if (tasks.length === 1 && !tasks[0].endPoint) {
        taskTargets = bidTask.otherValues;
      } else {
        taskTargets = tasks;
      }

      let items: BidItemType[] = [];

      setLoading(true);

      for (const task of taskTargets) {
        try {
          const res = await searchApi.bid(task.endPoint, query);
          items = items.concat(res.response.body.items || []);
        } catch (e) {
          const error = e as any;
          setMessage({ error: error.message });
        }
      }
      const includeRegExp = include.length && new KeywordRegExp(include);
      const excludeRegExp = exclude.length && new KeywordRegExp(exclude);

      const rows = items.filter((item) => {
        const text = [item.bidNtceNm, item.ntceInsttNm, item.dminsttNm].join();

        return (
          (includeRegExp ? includeRegExp.test(text) : true) &&
          (excludeRegExp ? !excludeRegExp.test(text) : true)
        );
      });

      setState((prev) => ({ ...prev, rows }));
      setLoading(false);
      setMessage({ info: `${rows.length}건의 결과가 검색되었습니다.` });
    }, [tasks, query, setState, setLoading, setMessage]);
  }
}

export const bidSearchStore = new BidSearchStore(BidSearchStore.name, {
  tasks: bidTask.initValues,
  query: {
    inqryBgnDt: DateTime.local().toFormat(DateFormat),
    inqryEndDt: DateTime.local().toFormat(DateFormat),
  },
  rows: [],
});