import os
from types import SimpleNamespace

import pytest
from mock import patch

with patch.dict(os.environ, {"BucketName": "test"}):
    from backend.lambdas.tasks.delete_query_results import handler

pytestmark = [pytest.mark.unit, pytest.mark.task]


@patch("backend.lambdas.tasks.delete_query_results.bucket")
def test_it_returns_all_deleted_results(bucket_mock):
    expected_result = [{'Key': 'test'}]
    bucket_mock.objects.filter.return_value = bucket_mock
    bucket_mock.delete.return_value = [{"Deleted": [{'Key': 'test'}]}]

    resp = handler({"ExecutionName": "test"}, SimpleNamespace())
    assert expected_result == resp


@patch("backend.lambdas.tasks.delete_query_results.bucket")
def test_it_deletes_only_the_execution_id(bucket_mock):
    bucket_mock.objects.filter.return_value = bucket_mock
    bucket_mock.delete.return_value = [{"Deleted": [{'Key': 'test'}]}]

    handler({"ExecutionName": "test"}, SimpleNamespace())
    bucket_mock.objects.filter.assert_called_with(Prefix="test/")


@patch("backend.lambdas.tasks.delete_query_results.bucket")
def test_it_throws_for_failed_deletions(bucket_mock):
    bucket_mock.objects.filter.return_value = bucket_mock
    bucket_mock.delete.return_value = [
        {"Deleted": [{'Key': 'test'}]},
        {"Errors": [{'Key': 'fail'}]},
    ]

    with pytest.raises(RuntimeError):
        handler({"ExecutionName": "test"}, SimpleNamespace())