"""
AWS bootstrap helper for Campus Pulse.

What it does:
1. Verifies boto3 can find AWS credentials.
2. Prints the active AWS account/region.
3. Ensures the DynamoDB table from config.py exists.
4. Optionally tests Rekognition on a local image.

Usage:
    ./.venv/bin/python aws_bootstrap.py
    ./.venv/bin/python aws_bootstrap.py --image image2.jpg
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError

from config import AWS_REGION, DYNAMO_TABLE


def verify_credentials(session: boto3.Session) -> str:
    sts = session.client("sts", region_name=AWS_REGION)
    identity = sts.get_caller_identity()
    account_id = identity["Account"]
    arn = identity["Arn"]
    print(f"AWS account: {account_id}")
    print(f"AWS identity: {arn}")
    print(f"AWS region: {AWS_REGION}")
    return account_id


def ensure_dynamo_table(session: boto3.Session) -> None:
    dynamodb = session.client("dynamodb", region_name=AWS_REGION)
    existing_tables = dynamodb.list_tables()["TableNames"]

    if DYNAMO_TABLE in existing_tables:
        print(f"DynamoDB table already exists: {DYNAMO_TABLE}")
        return

    print(f"Creating DynamoDB table: {DYNAMO_TABLE}")
    dynamodb.create_table(
        TableName=DYNAMO_TABLE,
        AttributeDefinitions=[
            {"AttributeName": "floor_id", "AttributeType": "S"},
            {"AttributeName": "timestamp", "AttributeType": "S"},
        ],
        KeySchema=[
            {"AttributeName": "floor_id", "KeyType": "HASH"},
            {"AttributeName": "timestamp", "KeyType": "RANGE"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    waiter = dynamodb.get_waiter("table_exists")
    waiter.wait(TableName=DYNAMO_TABLE)
    print(f"Created DynamoDB table: {DYNAMO_TABLE}")


def test_rekognition(session: boto3.Session, image_path: Path) -> None:
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    rek = session.client("rekognition", region_name=AWS_REGION)
    with image_path.open("rb") as f:
        payload = f.read()

    response = rek.detect_labels(Image={"Bytes": payload}, MinConfidence=70)
    person_label = next((label for label in response["Labels"] if label["Name"] == "Person"), None)
    count = len(person_label["Instances"]) if person_label else 0
    print(f"Rekognition test passed. Detected people: {count}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", help="Optional local image to test Rekognition")
    args = parser.parse_args()

    session = boto3.Session(region_name=AWS_REGION)

    try:
        verify_credentials(session)
        ensure_dynamo_table(session)
        if args.image:
            test_rekognition(session, Path(args.image))
        else:
            print("Skipping Rekognition test. Pass --image <path> to run it.")
        print("AWS bootstrap completed successfully.")
        return 0
    except NoCredentialsError:
        print("No AWS credentials found.", file=sys.stderr)
        print(
            "Set AWS credentials first, then rerun this script.\n"
            "Example:\n"
            "export AWS_ACCESS_KEY_ID=...\n"
            "export AWS_SECRET_ACCESS_KEY=...\n"
            f"export AWS_DEFAULT_REGION={AWS_REGION}",
            file=sys.stderr,
        )
        return 1
    except (ClientError, BotoCoreError, FileNotFoundError) as exc:
        print(f"AWS bootstrap failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
