import asyncio
import statistics
import time
from collections.abc import Callable
from typing import Any


class PerformanceAnalyzer:
    """パフォーマンス分析ツール"""

    def __init__(self):
        self.results: dict[str, Any] = {}

    async def measure_async_function(
        self, func: Callable, *args, iterations: int = 1, name: str = None
    ) -> dict[str, Any]:
        """非同期関数のパフォーマンス測定"""
        function_name = name or func.__name__
        execution_times = []

        for _ in range(iterations):
            # 実行時間測定
            start_time = time.perf_counter()

            if asyncio.iscoroutinefunction(func):
                await func(*args)
            else:
                func(*args)

            end_time = time.perf_counter()
            execution_time = end_time - start_time
            execution_times.append(execution_time)

        # 統計情報計算
        stats = {
            "function_name": function_name,
            "iterations": iterations,
            "execution_times": {
                "min": min(execution_times),
                "max": max(execution_times),
                "mean": statistics.mean(execution_times),
                "median": statistics.median(execution_times),
                "stdev": statistics.stdev(execution_times)
                if len(execution_times) > 1
                else 0,
            },
            "throughput": iterations / sum(execution_times),
        }

        self.results[function_name] = stats
        return stats

    def measure_sync_function(
        self, func: Callable, *args, iterations: int = 1, name: str = None
    ) -> dict[str, Any]:
        """同期関数のパフォーマンス測定"""
        function_name = name or func.__name__
        execution_times = []

        for _ in range(iterations):
            # 実行時間測定
            start_time = time.perf_counter()
            func(*args)
            end_time = time.perf_counter()

            execution_time = end_time - start_time
            execution_times.append(execution_time)

        # 統計情報計算
        stats = {
            "function_name": function_name,
            "iterations": iterations,
            "execution_times": {
                "min": min(execution_times),
                "max": max(execution_times),
                "mean": statistics.mean(execution_times),
                "median": statistics.median(execution_times),
                "stdev": statistics.stdev(execution_times)
                if len(execution_times) > 1
                else 0,
            },
            "throughput": iterations / sum(execution_times),
        }

        self.results[function_name] = stats
        return stats

    def compare_functions(
        self, baseline_name: str, comparison_name: str
    ) -> dict[str, Any]:
        """2つの関数のパフォーマンス比較"""
        if baseline_name not in self.results or comparison_name not in self.results:
            raise ValueError("Both functions must be measured before comparison")

        baseline = self.results[baseline_name]
        comparison = self.results[comparison_name]

        comparison_result = {
            "baseline": baseline_name,
            "comparison": comparison_name,
            "speed_improvement": baseline["execution_times"]["mean"]
            / comparison["execution_times"]["mean"],
            "throughput_improvement": comparison["throughput"] / baseline["throughput"],
        }

        return comparison_result

    def generate_report(self) -> str:
        """パフォーマンスレポート生成"""
        report_lines = ["Performance Analysis Report", "=" * 50, ""]

        for function_name, stats in self.results.items():
            report_lines.extend(
                [
                    f"Function: {function_name}",
                    f"Iterations: {stats['iterations']}",
                    "Execution Time (seconds):",
                    f"  - Mean: {stats['execution_times']['mean']:.6f}",
                    f"  - Median: {stats['execution_times']['median']:.6f}",
                    f"  - Min: {stats['execution_times']['min']:.6f}",
                    f"  - Max: {stats['execution_times']['max']:.6f}",
                    f"  - StdDev: {stats['execution_times']['stdev']:.6f}",
                    f"Throughput: {stats['throughput']:.2f} ops/sec",
                    "-" * 30,
                    "",
                ]
            )

        return "\n".join(report_lines)

    def get_performance_recommendations(self) -> list[str]:
        """パフォーマンス改善の推奨事項"""
        recommendations = []

        for function_name, stats in self.results.items():
            mean_time = stats["execution_times"]["mean"]
            stdev_time = stats["execution_times"]["stdev"]

            # 実行時間が遅い場合
            if mean_time > 0.1:
                recommendations.append(
                    f"{function_name}: 実行時間が遅いです ({mean_time:.3f}s)。"
                    "クエリの最適化やインデックスの追加を検討してください。"
                )

            # 実行時間のばらつきが大きい場合
            if stdev_time > mean_time * 0.5:
                recommendations.append(
                    f"{function_name}: 実行時間のばらつきが大きいです "
                    f"(StdDev: {stdev_time:.3f}s)。"
                    "コネクションプールの設定やキャッシュの導入を検討してください。"
                )

            # スループットが低い場合
            if stats["throughput"] < 10:
                throughput = stats["throughput"]
                recommendations.append(
                    f"{function_name}: スループットが低いです "
                    f"({throughput:.1f} ops/sec)。"
                    "並行処理やバッチ処理の導入を検討してください。"
                )

        if not recommendations:
            recommendations.append(
                "パフォーマンスは良好です。現在の実装を維持してください。"
            )

        return recommendations


class DatabasePerformanceAnalyzer:
    """データベース専用パフォーマンス分析ツール"""

    def __init__(self, session):
        self.session = session
        self.query_stats = {}

    async def analyze_query_performance(
        self, query: str, params: dict = None
    ) -> dict[str, Any]:
        """クエリのパフォーマンス分析"""
        from sqlalchemy import text

        # EXPLAIN ANALYZE実行（PostgreSQLの場合）
        explain_query = f"EXPLAIN ANALYZE {query}"

        try:
            start_time = time.perf_counter()
            result = await self.session.execute(text(explain_query), params or {})
            end_time = time.perf_counter()

            execution_time = end_time - start_time
            explain_result = result.fetchall()

            # 実際のクエリ実行
            start_time = time.perf_counter()
            actual_result = await self.session.execute(text(query), params or {})
            end_time = time.perf_counter()

            actual_execution_time = end_time - start_time
            row_count = len(actual_result.fetchall())

            analysis = {
                "query": query,
                "execution_time": actual_execution_time,
                "row_count": row_count,
                "explain_result": [str(row[0]) for row in explain_result],
                "performance_score": self._calculate_performance_score(
                    actual_execution_time, row_count
                ),
            }

            self.query_stats[query] = analysis
            return analysis

        except Exception:
            # SQLiteなどEXPLAIN ANALYZEをサポートしていない場合
            start_time = time.perf_counter()
            result = await self.session.execute(text(query), params or {})
            end_time = time.perf_counter()

            execution_time = end_time - start_time
            row_count = len(result.fetchall())

            analysis = {
                "query": query,
                "execution_time": execution_time,
                "row_count": row_count,
                "explain_result": ["EXPLAIN not supported"],
                "performance_score": self._calculate_performance_score(
                    execution_time, row_count
                ),
            }

            self.query_stats[query] = analysis
            return analysis

    def _calculate_performance_score(
        self, execution_time: float, row_count: int
    ) -> str:
        """パフォーマンススコア計算"""
        if execution_time < 0.01:
            return "Excellent"
        elif execution_time < 0.1:
            return "Good"
        elif execution_time < 0.5:
            return "Fair"
        else:
            return "Poor"

    def get_slow_queries(self, threshold: float = 0.1) -> list[dict[str, Any]]:
        """遅いクエリの特定"""
        slow_queries = []

        for _query, stats in self.query_stats.items():
            if stats["execution_time"] > threshold:
                slow_queries.append(stats)

        return sorted(slow_queries, key=lambda x: x["execution_time"], reverse=True)

    def generate_optimization_suggestions(self) -> list[str]:
        """最適化提案の生成"""
        suggestions = []
        slow_queries = self.get_slow_queries()

        for query_stats in slow_queries:
            query = query_stats["query"]
            execution_time = query_stats["execution_time"]

            if "SELECT *" in query.upper():
                suggestions.append(
                    f"クエリ '{query[:50]}...' で SELECT * を使用しています。"
                    "必要なカラムのみを指定することを検討してください。"
                )

            if "LIKE" in query.upper() and execution_time > 0.2:
                suggestions.append(
                    f"クエリ '{query[:50]}...' でLIKE検索が遅いです "
                    f"({execution_time:.3f}s)。"
                    "全文検索インデックスの使用を検討してください。"
                )

            if "ORDER BY" in query.upper() and execution_time > 0.1:
                suggestions.append(
                    f"クエリ '{query[:50]}...' でソートが遅いです "
                    f"({execution_time:.3f}s)。"
                    "ソート対象カラムにインデックスを追加してください。"
                )

        return suggestions
