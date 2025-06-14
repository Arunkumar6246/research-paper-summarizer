"""create models

Revision ID: 2b2f55782391
Revises: 
Create Date: 2025-06-09 12:52:34.080705

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b2f55782391'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('papers',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('filename', sa.String(), nullable=True),
    sa.Column('file_path', sa.String(), nullable=True),
    sa.Column('upload_date', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_papers_filename'), 'papers', ['filename'], unique=True)
    op.create_index(op.f('ix_papers_id'), 'papers', ['id'], unique=False)
    op.create_table('summaries',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('paper_id', sa.Integer(), nullable=True),
    sa.Column('original_text', sa.String(), nullable=True),
    sa.Column('section_title', sa.String(), nullable=True),
    sa.Column('summary_text', sa.Text(), nullable=True),
    sa.Column('page', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_summaries_id'), 'summaries', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_summaries_id'), table_name='summaries')
    op.drop_table('summaries')
    op.drop_index(op.f('ix_papers_id'), table_name='papers')
    op.drop_index(op.f('ix_papers_filename'), table_name='papers')
    op.drop_table('papers')
    # ### end Alembic commands ###
