"""merge_heads

Revision ID: 81f69e3545aa
Revises: 3cce8bcb1be2, b6d6cfa6a86f
Create Date: 2025-10-24 21:19:08.743589

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81f69e3545aa'
down_revision: Union[str, Sequence[str], None] = ('3cce8bcb1be2', 'b6d6cfa6a86f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
