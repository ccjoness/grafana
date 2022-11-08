// Copyright (c) 2017 Uber Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { values as _values } from 'lodash';
import TreeNode from 'src/utils/TreeNode';

import traceGenerator from '../demo/trace-generators';
import { TraceResponse, TraceSpanData } from '../types/trace';
import { numberSortComparator } from '../utils/sort';

import {
  getSpanId,
  getSpanName,
  getSpanParentId,
  getSpanProcess,
  getSpanProcessId,
  getSpanServiceName,
  getSpanTimestamp,
} from './span';
import * as traceSelectors from './trace';
import { followsFromRef } from './trace.fixture';

const generatedTrace: TraceResponse = traceGenerator.trace({ numberOfSpans: 45 });

it('getTraceId() should return the traceID', () => {
  expect(traceSelectors.getTraceId(generatedTrace)).toBe(generatedTrace.traceID);
});

it('hydrateSpansWithProcesses() should return the trace with processes on each span', () => {
  const hydratedTrace = traceSelectors.hydrateSpansWithProcesses(generatedTrace);

  hydratedTrace.spans.forEach((span) =>
    expect(getSpanProcess(span)).toBe(generatedTrace.processes[getSpanProcessId(span)])
  );
});

it('getTraceSpansAsMap() should return a map of all of the spans', () => {
  const spanMap = traceSelectors.getTraceSpansAsMap(generatedTrace);
  [...spanMap.entries()].forEach((pair) => {
    expect(pair[1]).toEqual(generatedTrace.spans.find((span) => getSpanId(span) === pair[0]));
  });
});

describe('getTraceSpanIdsAsTree()', () => {
  it('builds the tree properly', () => {
    const tree = traceSelectors.getTraceSpanIdsAsTree(generatedTrace);
    const spanMap = traceSelectors.getTraceSpansAsMap(generatedTrace);

    tree.walk((value: string, node: TreeNode) => {
      const expectedParentValue = value === traceSelectors.TREE_ROOT_ID ? null : value;
      node.children.forEach((childNode) => {
        expect(getSpanParentId(spanMap.get(childNode.value))).toBe(expectedParentValue);
      });
    });
  });

  it('#115 - handles FOLLOW_FROM refs', () => {
    expect(() => traceSelectors.getTraceSpanIdsAsTree(followsFromRef)).not.toThrow();
  });
});

it('getParentSpan() should return the parent span of the tree', () => {
  expect(traceSelectors.getParentSpan(generatedTrace)).toBe(
    traceSelectors
      .getTraceSpansAsMap(generatedTrace)
      .get(traceSelectors.getTraceSpanIdsAsTree(generatedTrace).children[0].value)
  );
});

it('getParentSpan() should return the first span if there are multiple parents', () => {
  const firstSpan = generatedTrace.spans[0];
  expect(traceSelectors.getParentSpan(generatedTrace)).toBe(firstSpan);
});

it('getTraceName() should return a formatted name for the first span', () => {
  const hydratedTrace = traceSelectors.hydrateSpansWithProcesses(generatedTrace);
  const parentSpan = traceSelectors.getParentSpan(hydratedTrace);

  expect(traceSelectors.getTraceName(hydratedTrace)).toBe(
    `${getSpanServiceName(parentSpan)}: ${getSpanName(parentSpan)}`
  );
});

it('getTraceSpanCount() should return the length of the spans array', () => {
  expect(traceSelectors.getTraceSpanCount(generatedTrace)).toBe(generatedTrace.spans.length);
});

it('getTraceDuration() should return the duration for the span', () => {
  expect(traceSelectors.getTraceDuration(generatedTrace)).toBe(generatedTrace.spans[0].duration);
});

it('getTraceTimestamp() should return the first timestamp for the conventional trace', () => {
  expect(traceSelectors.getTraceTimestamp(generatedTrace)).toBe(generatedTrace.spans[0].startTime);
});

it('getTraceDepth() should determine the total depth of the trace tree', () => {
  expect(traceSelectors.getTraceDepth(generatedTrace)).toBe(
    traceSelectors.getTraceSpanIdsAsTree(generatedTrace).depth - 1
  );
});

it('getSpanDepthForTrace() should determine the depth of a given span in the parent', () => {
  function testDepthCalc(span: TraceSpanData) {
    let depth = 2;
    let currentId = getSpanParentId(span);

    const findCurrentSpanById = (item: TraceSpanData) => getSpanId(item) === currentId;
    while (currentId !== getSpanId(generatedTrace.spans[0])) {
      depth++;
      currentId = getSpanParentId(generatedTrace.spans.find(findCurrentSpanById)!);
    }

    // console.log('hypothetical depth', depth);

    expect(
      traceSelectors.getSpanDepthForTrace({
        trace: generatedTrace,
        span,
      })
    ).toBe(depth);
  }

  // test depth calculations for a few random spans
  testDepthCalc(generatedTrace.spans[1]);
  testDepthCalc(generatedTrace.spans[Math.floor(generatedTrace.spans.length / 2)]);
  testDepthCalc(generatedTrace.spans[Math.floor(generatedTrace.spans.length / 4)]);
  testDepthCalc(generatedTrace.spans[Math.floor(generatedTrace.spans.length * 0.75)]);
});

it('getTraceServices() should return an unique array of all services in the trace', () => {
  const svcs = [...traceSelectors.getTraceServices(generatedTrace)].sort();
  const set = new Set(_values(generatedTrace.processes).map((v) => v.serviceName));
  const setSvcs = [...set.values()].sort();
  expect(svcs).toEqual(setSvcs);
});

it('getTraceServiceCount() should return the length of the service list', () => {
  expect(traceSelectors.getTraceServiceCount(generatedTrace)).toBe(
    Object.values(generatedTrace.processes).reduce((results, process) => results.add(process.serviceName), new Set())
      .size
  );
});

it('formatDurationForUnit() should use the formatters to return the proper value', () => {
  expect(traceSelectors.formatDurationForUnit({ duration: 302000, unit: 'ms' })).toBe('302ms');

  expect(traceSelectors.formatDurationForUnit({ duration: 1302000, unit: 'ms' })).toBe('1302ms');

  expect(traceSelectors.formatDurationForUnit({ duration: 1302000, unit: 's' })).toBe('1.302s');

  expect(traceSelectors.formatDurationForUnit({ duration: 90000, unit: 's' })).toBe('0.09s');
});

it('formatDurationForTrace() should return a ms value for traces shorter than a second', () => {
  const firstSpan = generatedTrace.spans[0];
  firstSpan.duration = 600000;
  expect(
    traceSelectors.formatDurationForTrace({
      trace: {
        ...generatedTrace,
        spans: [firstSpan],
      },
      duration: 302000,
    })
  ).toBe('302ms');
});

it('formatDurationForTrace() should return a s value for traces longer than a second', () => {
  expect(
    traceSelectors.formatDurationForTrace({
      trace: {
        ...generatedTrace,
        spans: generatedTrace.spans.concat([
          {
            ...generatedTrace.spans[0],
            duration: 1000000,
          },
        ]),
      },
      duration: 302000,
    })
  ).toBe('0.302s');

  expect(
    traceSelectors.formatDurationForTrace({
      trace: {
        ...generatedTrace,
        spans: generatedTrace.spans.concat([
          {
            ...generatedTrace.spans[0],
            duration: 1200000,
          },
        ]),
      },
      duration: 302000,
    })
  ).toBe('0.302s');
});

it('getSortedSpans() should sort spans given a sort object', () => {
  expect(
    traceSelectors.getSortedSpans({
      trace: generatedTrace,
      spans: generatedTrace.spans,
      sort: {
        dir: 1,
        comparator: numberSortComparator,
        selector: getSpanTimestamp,
      },
    })
  ).toEqual([...generatedTrace.spans].sort((spanA, spanB) => spanA.startTime - spanB.startTime));

  expect(
    traceSelectors.getSortedSpans({
      trace: generatedTrace,
      spans: generatedTrace.spans,
      sort: {
        dir: -1,
        comparator: numberSortComparator,
        selector: getSpanTimestamp,
      },
    })
  ).toEqual([...generatedTrace.spans].sort((spanA, spanB) => spanB.startTime - spanA.startTime));
});

it('getTreeSizeForTraceSpan() should return the size for the parent span', () => {
  expect(
    traceSelectors.getTreeSizeForTraceSpan({
      trace: generatedTrace,
      span: generatedTrace.spans[0],
    })
  ).toBe(generatedTrace.spans.length - 1);
});

it('getTreeSizeForTraceSpan() should return the size for a child span', () => {
  expect(
    traceSelectors.getTreeSizeForTraceSpan({
      trace: generatedTrace,
      span: generatedTrace.spans[1],
    })
  ).toBe(traceSelectors.getTraceSpanIdsAsTree(generatedTrace).find(generatedTrace.spans[1].spanID).size - 1);
});

it('getTreeSizeForTraceSpan() should return -1 for an absent span', () => {
  const absentSpan = generatedTrace.spans[0];
  absentSpan.spanID = 'whatever';

  expect(
    traceSelectors.getTreeSizeForTraceSpan({
      trace: generatedTrace,
      span: absentSpan,
    })
  ).toBe(-1);
});

it('getTraceName() should return the trace name based on the parentSpan', () => {
  const serviceName = generatedTrace.processes[generatedTrace.spans[0].processID].serviceName;
  const operationName = generatedTrace.spans[0].operationName;

  expect(traceSelectors.getTraceName(generatedTrace)).toBe(`${serviceName}: ${operationName}`);
});

it('omitCollapsedSpans() should filter out collapsed spans', () => {
  const span = generatedTrace.spans[1];
  const size = traceSelectors.getTraceSpanIdsAsTree(generatedTrace).find(span.spanID).size - 1;

  expect(
    traceSelectors.omitCollapsedSpans({
      trace: generatedTrace,
      spans: generatedTrace.spans,
      collapsed: [span.spanID],
    }).length
  ).toBe(generatedTrace.spans.length - size);
});

it('getTicksForTrace() should return a list of ticks given interval parameters', () => {
  const trace = generatedTrace;
  const timestamp = new Date().getTime() * 1000;

  trace.spans.forEach((span) => {
    span.duration = 3000000;
    span.startTime = timestamp;
  });

  expect(
    traceSelectors.getTicksForTrace({
      trace,
      interval: 3,
      width: 10,
    })
  ).toEqual([
    { timestamp, width: 10 },
    { timestamp: timestamp + 1000000, width: 10 },
    { timestamp: timestamp + 2000000, width: 10 },
    { timestamp: timestamp + 3000000, width: 10 },
  ]);
});

it('getTicksForTrace() should use defaults', () => {
  const timestamp = new Date().getTime() * 1000;
  const trace = traceGenerator.trace({ numberOfSpans: 1 });

  trace.spans = [
    {
      traceID: '5031233a-d0b5-5d41-9b4b-4c072bcf5020',
      processID: 'b5f4e0ff-7318-5017-a3f3-9c7b423a82aa',
      spanID: 'e871771f-f1b4-54af-9e9d-826259c2915e',
      flags: 0,
      logs: [],
      operationName: 'POST',
      startTime: timestamp,
      duration: 4000000,
    },
  ];

  expect(traceSelectors.getTicksForTrace({ trace })).toEqual([
    { timestamp, width: traceSelectors.DEFAULT_TICK_WIDTH },
    {
      timestamp: timestamp + 1000000,
      width: traceSelectors.DEFAULT_TICK_WIDTH,
    },
    {
      timestamp: timestamp + 2000000,
      width: traceSelectors.DEFAULT_TICK_WIDTH,
    },
    {
      timestamp: timestamp + 3000000,
      width: traceSelectors.DEFAULT_TICK_WIDTH,
    },
    {
      timestamp: timestamp + 4000000,
      width: traceSelectors.DEFAULT_TICK_WIDTH,
    },
  ]);
});